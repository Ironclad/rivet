import { auth } from '@/lib/auth';
import { OPTIONS, getRestrictedAccessControlHeaders } from '@/app/api/cors';
import { RivetTemplateId, getTemplate, putScreenshot, putTemplate } from '@/lib/templates';
import { produce } from 'immer';

export { OPTIONS };

export async function POST(request: Request, { params }: { params: { graphId: string; version: string } }) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { graphId, version } = params;

  const template = await getTemplate(graphId as RivetTemplateId);

  if (!template) {
    return Response.json({ error: 'Graph not found' }, { status: 404 });
  }

  if (template.author !== session.user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templateVersion = template.versions.find((v) => v.version === version);

  if (!templateVersion) {
    return Response.json({ error: 'Version not found' }, { status: 404 });
  }

  const screenshotBody = await request.arrayBuffer();

  const url = await putScreenshot(new Uint8Array(screenshotBody));

  const newTemplate = produce(template, (draft) => {
    const versionIndex = draft.versions.findIndex((v) => v.version === version);
    draft.versions[versionIndex].screenshotUrls.push(url);
  });

  await putTemplate(newTemplate);

  const newVersion = newTemplate.versions.find((v) => v.version === version)!;

  return Response.json(newVersion.screenshotUrls, {
    headers: {
      ...getRestrictedAccessControlHeaders(request),
    },
  });
}

export async function DELETE(request: Request, { params }: { params: { graphId: string; version: string } }) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { graphId, version } = params;

  const template = await getTemplate(graphId as RivetTemplateId);

  if (!template) {
    return Response.json({ error: 'Graph not found' }, { status: 404 });
  }

  if (template.author !== session.user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templateVersion = template.versions.find((v) => v.version === version);

  if (!templateVersion) {
    return Response.json({ error: 'Version not found' }, { status: 404 });
  }

  const screenshotUrl = new URL(request.url).searchParams.get('url');

  if (!screenshotUrl) {
    return Response.json({ error: 'Screenshot url is required' }, { status: 400 });
  }

  const newTemplate = produce(template, (draft) => {
    const versionIndex = draft.versions.findIndex((v) => v.version === version);
    draft.versions[versionIndex].screenshotUrls = draft.versions[versionIndex].screenshotUrls.filter(
      (url) => url !== screenshotUrl,
    );
  });

  await putTemplate(newTemplate);

  const newVersion = newTemplate.versions.find((v) => v.version === version)!;

  return Response.json(newVersion.screenshotUrls, {
    headers: {
      ...getRestrictedAccessControlHeaders(request),
    },
  });
}
