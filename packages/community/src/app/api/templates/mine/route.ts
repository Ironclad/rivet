import { OPTIONS, getRestrictedAccessControlHeaders } from '@/app/api/cors';
import { auth } from '@/lib/auth';
import { getTemplatesForUser } from '@/lib/templates';

export { OPTIONS };

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = await getTemplatesForUser(session.user.id);

  return Response.json(templates, {
    headers: {
      ...getRestrictedAccessControlHeaders(request),
      'Cache-Control': 'private',
    },
  });
}
