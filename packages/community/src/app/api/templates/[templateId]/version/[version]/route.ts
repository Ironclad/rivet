import {
  RivetTemplateId,
  RivetTemplateVersion,
  deleteTemplateVersion,
  getTemplate,
  putTemplateData,
  putTemplateVersion,
} from '@/lib/templates';
import { getPublicAccessControlHeaders, getRestrictedAccessControlHeaders } from '@/app/api/cors';
import { auth } from '@/lib/auth';
import { array, object, string } from '@recoiljs/refine';
import { BuiltInNodes, GraphInputNode, Project, deserializeProject } from '@ironclad/rivet-core';

export { OPTIONS } from '@/app/api/cors';

export async function GET(_request: Request, { params }: { params: { templateId: string; version: string } }) {
  const { templateId, version } = params;

  const graph = await getTemplate(templateId as RivetTemplateId);

  if (!graph) {
    return Response.json({ error: 'Graph not found' }, { status: 404 });
  }

  const graphVersion = graph.versions.find((v) => v.version === version);

  if (!graphVersion) {
    return Response.json({ error: 'Version not found' }, { status: 404 });
  }

  return Response.json(
    {
      ...graphVersion,
      graph: {
        ...graph,
        versions: undefined,
      },
    },
    {
      headers: {
        ...getPublicAccessControlHeaders(),
        'Cache-Control': 's-maxage=1, stale-while-revalidate',
      },
    },
  );
}

const putVersionBodyChecker = object({
  descriptionMarkdown: string(),
  versionDescriptionMarkdown: string(),
  plugins: array(string()),
  serializedProject: string(),
});

export async function PUT(request: Request, { params }: { params: { templateId: string; version: string } }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { templateId, version } = params;

  const template = await getTemplate(templateId as RivetTemplateId);
  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.author !== session.user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const previousVersion = template.versions[template.versions.length - 1];

  const body = await request.json();

  const bodyResult = putVersionBodyChecker(body);
  if (bodyResult.type === 'failure') {
    return Response.json({ error: bodyResult.message }, { status: 400 });
  }

  let project: Project;
  try {
    [project] = deserializeProject(bodyResult.value.serializedProject);
  } catch (err) {
    return Response.json({ error: 'Invalid project' }, { status: 400 });
  }

  const encodedGraph = new TextEncoder().encode(bodyResult.value.serializedProject);
  const graphSize = encodedGraph.length;
  const numNodes = Object.values(project.graphs).reduce((acc, g) => acc + g.nodes.length, 0);
  const blobUrl = await putTemplateData(encodedGraph);
  const includesCodeNodes = Object.values(project.graphs).some((g) => g.nodes.some((n) => n.type === 'code'));

  const mainGraph = project.metadata.mainGraphId;

  let inputs: string[] = [];
  let outputs: string[] = [];

  if (mainGraph != null) {
    const graph = project.graphs[mainGraph];
    inputs = (graph.nodes as BuiltInNodes[])
      .filter((n): n is GraphInputNode => n.type === 'graphInput')
      .map((n) => n.data.id);

    outputs = (graph.nodes as BuiltInNodes[])
      .filter((n): n is GraphInputNode => n.type === 'graphOutput')
      .map((n) => n.data.id);
  }

  const newVersion: RivetTemplateVersion = {
    blobUrl,
    createdAt: new Date().toISOString(),
    descriptionMarkdown: bodyResult.value.descriptionMarkdown,
    numNodes,
    plugins: bodyResult.value.plugins,
    sizeBytes: graphSize,
    version,
    versionDescriptionMarkdown: bodyResult.value.versionDescriptionMarkdown,
    includesCodeNodes,
    inputs,
    outputs,
    hasMainGraph: mainGraph != null,
    graphNames: Object.values(project.graphs).map((g) => g.metadata!.name!),
    numGraphs: Object.values(project.graphs).length,
    templateParameters: {}, // TODO support templates
    screenshotUrls: previousVersion?.screenshotUrls ?? [],
    canBeNode: false, // TODO support templates
  };
  await putTemplateVersion(templateId as RivetTemplateId, newVersion);

  return Response.json(newVersion, {
    headers: {
      ...getRestrictedAccessControlHeaders(request),
    },
  });
}

export async function DELETE(request: Request, { params }: { params: { templateId: string; version: string } }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { templateId, version } = params;

  const graph = await getTemplate(templateId as RivetTemplateId);
  if (!graph) {
    return Response.json({ error: 'Graph not found' }, { status: 404 });
  }

  if (graph.author !== session.user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const versionIndex = graph.versions.findIndex((v) => v.version === version);

  if (versionIndex === -1) {
    return Response.json({ error: 'Version not found' }, { status: 404 });
  }

  await deleteTemplateVersion(templateId as RivetTemplateId, version);

  return Response.json(graph, {
    headers: {
      ...getRestrictedAccessControlHeaders(request),
    },
  });
}
