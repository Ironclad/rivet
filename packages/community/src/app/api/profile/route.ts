import { auth } from '@/lib/auth';
import { getUser, setUser } from '@/lib/users';
import { object, string } from '@recoiljs/refine';
import { OPTIONS, getRestrictedAccessControlHeaders } from '@/app/api/cors';

export { OPTIONS };

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response(null, {
      status: 401,
    });
  }

  const user = await getUser(session.user.id);

  if (!user) {
    return new Response(null, {
      status: 401,
    });
  }

  return Response.json(
    {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
      },
    },
    {
      headers: {
        ...getRestrictedAccessControlHeaders(request),
        'Cache-Control': 'private, max-age=0, no-cache',
      },
    },
  );
}

const putProfileChecker = object({
  username: string(),
  displayName: string(),
  email: string(),
});

export async function PUT(request: Request) {
  const session = await auth();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUser(session.user.id);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const bodyResult = putProfileChecker(body);

  if (bodyResult.type === 'failure') {
    return Response.json({ error: bodyResult.message }, { status: 400 });
  }

  user.username = bodyResult.value.username;
  user.displayName = bodyResult.value.displayName;
  user.email = bodyResult.value.email;

  await setUser(user);

  return Response.json(
    {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
      },
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=0, no-cache',
        ...getRestrictedAccessControlHeaders(request),
      },
    },
  );
}
