import { array, object, string } from '@recoiljs/refine';
import { RivetTemplate, RivetTemplateId, getAllTemplates, putTemplate } from '@/lib/templates';
import { getPublicAccessControlHeaders, getRestrictedAccessControlHeaders, OPTIONS } from '../cors';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';

export { OPTIONS };

export async function GET(_request: Request) {
  const allTemplates = await getAllTemplates();

  return Response.json(allTemplates, {
    headers: {
      ...getPublicAccessControlHeaders(),
      'Cache-Control': 's-maxage=1, stale-while-revalidate',
    },
  });
}

const postBodyChecker = object({
  name: string(),
  tags: array(string()),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const bodyResult = postBodyChecker(body);

  if (bodyResult.type === 'failure') {
    return Response.json({ error: bodyResult.message }, { status: 400 });
  }

  const id = nanoid() as RivetTemplateId;

  const template: RivetTemplate = {
    id,
    name: bodyResult.value.name,
    author: session.user.id,
    versions: [],
    tags: bodyResult.value.tags,
  };

  await putTemplate(template);

  return Response.json(
    {
      ...template,
      stars: 0,
    },
    {
      headers: {
        ...getRestrictedAccessControlHeaders(request),
      },
    },
  );
}
