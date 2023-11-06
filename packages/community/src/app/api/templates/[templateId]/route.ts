import { RivetTemplateId, deleteTemplate, getTemplate, putTemplate } from '@/lib/templates';
import { OPTIONS, getPublicAccessControlHeaders, getRestrictedAccessControlHeaders } from '../../cors';
import { array, object, string } from '@recoiljs/refine';
import { auth } from '@/lib/auth';

export { OPTIONS };

export async function GET(_request: Request, { params }: { params: { templateId: string } }) {
  const { templateId } = params;

  const template = await getTemplate(templateId as RivetTemplateId);

  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  return Response.json(template, {
    headers: {
      ...getPublicAccessControlHeaders(),
      'Cache-Control': 's-maxage=1, stale-while-revalidate',
    },
  });
}

const putBodyChecker = object({
  name: string(),
  tags: array(string()),
});

export async function PUT(request: Request, { params }: { params: { templateId: string } }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { templateId } = params;

  const template = await getTemplate(templateId as RivetTemplateId);
  if (!template) {
    return Response.json({ error: 'Graph not found' }, { status: 404 });
  }

  if (template.author !== session.user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const bodyResult = putBodyChecker(body);

  if (bodyResult.type === 'failure') {
    return Response.json({ error: bodyResult.message }, { status: 400 });
  }

  const updatedGraph = {
    ...template,
    ...bodyResult.value,
  };

  await putTemplate(updatedGraph);

  return Response.json(updatedGraph, {
    headers: {
      ...getRestrictedAccessControlHeaders(request),
    },
  });
}

export async function DELETE(request: Request, { params }: { params: { templateId: string } }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { templateId } = params;

  const template = await getTemplate(templateId as RivetTemplateId);
  if (!template) {
    return Response.json({ error: 'Graph not found' }, { status: 404 });
  }

  if (template.author !== session.user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await deleteTemplate(templateId as RivetTemplateId);

  return Response.json({ success: true }, { headers: { ...getRestrictedAccessControlHeaders(request) } });
}
