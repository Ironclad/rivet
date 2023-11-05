import { auth } from '@/lib/auth';
import { OPTIONS, getRestrictedAccessControlHeaders } from '@/app/api/cors';
import { RivetTemplateId, templateExists, starTemplate, unstarTemplate } from '@/lib/templates';

export { OPTIONS };

export async function PUT(request: Request, { params }: { params: { graphId: string } }) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { graphId } = params;

  const graph = await templateExists(params.graphId as RivetTemplateId);

  if (!graph) {
    return Response.json({ error: 'Graph not found' }, { status: 404 });
  }

  await starTemplate(graphId as RivetTemplateId, session.user.id);

  return Response.json(
    { success: true },
    {
      headers: {
        ...getRestrictedAccessControlHeaders(request),
      },
    },
  );
}

export async function DELETE(request: Request, { params }: { params: { graphId: string } }) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { graphId } = params;

  const graph = await templateExists(params.graphId as RivetTemplateId);

  if (!graph) {
    return Response.json({ error: 'Graph not found' }, { status: 404 });
  }

  await unstarTemplate(graphId as RivetTemplateId, session.user.id);

  return Response.json(
    { success: true },
    {
      headers: {
        ...getRestrictedAccessControlHeaders(request),
      },
    },
  );
}
