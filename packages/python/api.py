import codecs
import pythonmonkey as pm
from . import runtime
import os

async def load_project_from_file(path):
    content = await read_file(path)
    return load_project_from_string(content)

def load_project_from_string(content):
    project = deserialize_project(content)['0']
    return project

async def load_project_and_attached_data_from_file(path):
    content = await read_file(path)
    return load_project_and_attached_data_from_string(content)

def load_project_and_attached_data_from_string(content):
    return deserialize_project(content)

async def read_file(path):
    with codecs.open(path, 'r', encoding='utf8') as file:
        return file.read()

def deserialize_project(content):
  return pm.eval("""
    (rivet, data) => rivet.deserializeProject(data)
  """)(runtime.rivet, content)

def run_graph_in_file(path, options):
  project = load_project_from_file(path)
  return run_graph(project, options)

def run_graph(project, options):
  processor = create_processor(project, options)
  return processor['run']()

def resolve_data_value(value):
    if isinstance(value, str):
        return {'type': 'string', 'value': value}
    elif isinstance(value, int) or isinstance(value, float):
        return {'type': 'number', 'value': value}
    elif isinstance(value, bool):
        return {'type': 'boolean', 'value': value}
    else:
        return value

def create_processor(project, graph, registry=None, inputs=None, context=None, remoteDebugger=None, onStart=None,
                    onNodeStart=None, onNodeFinish=None, onNodeError=None, onNodeExcluded=None,
                    onPartialOutput=None, onUserInput=None, onDone=None, onAbort=None, onGraphAbort=None, onTrace=None,
                    onNodeOutputsCleared=None, externalFunctions=None, onUserEvent=None, abortSignal=None,
                    nativeApi=None, openAiKey=None, openAiOrganization=None, pluginEnv=None, pluginSettings=None):

    inputs = inputs or {}
    context = context or {}

    graphs = { k : v for k, v in iter(project.graphs) }

    graph_id = graph if graph in graphs else next(
        (g.metadata.id for g in graphs.values() if g.metadata.name == graph), None)

    if not graph_id:
        raise Exception('Graph not found')

    processor = pm.eval("""
      (rivet, project, graphId, registry) => new rivet.GraphProcessor(project, graphId, registry)
    """)(runtime.rivet, project, graph_id, registry)

    if remoteDebugger:
        remoteDebugger.attach(processor)

    event_handlers = {
        'start': onStart, 'nodeStart': onNodeStart, 'nodeFinish': onNodeFinish, 'nodeError': onNodeError,
        'nodeExcluded': onNodeExcluded, 'partialOutput': onPartialOutput, 'userInput': onUserInput, 'done': onDone,
        'abort': onAbort, 'graphAbort': onGraphAbort, 'trace': onTrace, 'nodeOutputsCleared': onNodeOutputsCleared
    }

    for event, handler in event_handlers.items():
        if handler:
            processor.on(event, handler)

    if externalFunctions:
        for name, fn in externalFunctions.items():
            processor.setExternalFunction(name, fn)

    if onUserEvent:
        for name, fn in onUserEvent.items():
            processor.onUserEvent(name, fn)

    if abortSignal:
        abortSignal.addEventListener('abort', processor.abort)

    resolved_inputs = {k: resolve_data_value(v) for k, v in inputs.items()}
    resolved_context_values = {k: resolve_data_value(v) for k, v in context.items()}

    if not pluginEnv:
        pluginEnv = pm.eval("""
          (rivet, env) => rivet.getPluginEnvFromProcessEnv(env, rivet.globalRivetNodeRegistry)
        """)(runtime.rivet, dict(os.environ))

    async def run():
      outputs = await pm.eval("""
        async (rivet, processor, settings, inputs, context, httpProvider) => {
          const outputs = await processor.processGraph({
            settings,
            inputs,
            context,
            httpProvider,
          })

          return outputs;
        }
      """)(runtime.rivet, processor, {
          'openAiKey': openAiKey or '',
          'openAiOrganization': openAiOrganization,
          'pluginEnv': pluginEnv or {},
          'pluginSettings': pluginSettings or {},
          'recordingPlaybackLatency': 1000,
      }, resolved_inputs, resolved_context_values, runtime.http_provider)
      return outputs

    return processor, run
