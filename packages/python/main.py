import pythonmonkey as pm
import asyncio
from .api import load_project_from_file, create_processor
import os

# await pm.eval("""
#  async (rivet, data) => {}
# """)(runtime.rivet, data);

# async def run_graph():
#   output = await pm.eval("""
#     async (rivet, data, httpProvider, env) => {
#       const { GraphProcessor, deserializeProject, DummyNativeApi } = rivet;

#       const [project] = deserializeProject(data);
#       const processor = new GraphProcessor(project, 'M-ulV32UCscvbW6q_qS7a');

#       const outputs = await processor.processGraph({
#         settings: {
#           openAiKey: env.OPENAI_API_KEY,
#           openAiOrganization: env.OPENAI_ORGANIZATION_ID,
#           pluginEnv: env,
#           pluginSettings: {},
#         },
#         nativeApi: new DummyNativeApi(),
#         httpProvider
#       })

#       return outputs['response']
#     }
#   """)(runtime.rivet, data, runtime.http_provider, runtime.env)

#   print(output.value)

async def main():
  project = await load_project_from_file("/Users/andy.brenneke/Desktop/Testing4.rivet-project")
  openaiKey = os.environ.get("OPENAI_API_KEY")
  openaiOrganization = os.environ.get("OPENAI_ORG_ID")
  _, run = create_processor(project,
    graph="M-ulV32UCscvbW6q_qS7a",
    openAiKey=openaiKey,
    openAiOrganization=openaiOrganization)

  outputs = await run()

  print(outputs.response.value)

asyncio.run(main())
