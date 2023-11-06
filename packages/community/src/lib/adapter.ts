import { Adapter, AdapterSession } from '@auth/core/adapters';
import { kv } from '@vercel/kv';
import { GithubId, UserId, createUser, findOrCreateByGithub, getUser, getUserByEmail, setUser } from '@/lib/users';
import { nanoid } from 'nanoid';

type DbSession = Omit<AdapterSession, 'expires'> & { expires: number };

export function Adapter(): Adapter {
  return {
    async createSession(session) {
      const dbSession: DbSession = {
        ...session,
        expires: session.expires.valueOf(),
      };

      await kv.set(`session:by-token:${session.sessionToken}`, dbSession, { pxat: session.expires.valueOf() });
      await kv.set(`session:by-user:${session.userId}`, dbSession, { pxat: session.expires.valueOf() });
      return session;
    },

    async deleteSession(sessionToken) {
      const session = await kv.get<DbSession>(`session:by-token:${sessionToken}`);

      if (!session) {
        return;
      }

      await kv.del(`session:by-token:${sessionToken}`);
      await kv.del(`session:by-user:${session.userId}`);
    },

    async getUserByAccount(providerId) {
      const user = await findOrCreateByGithub(providerId.providerAccountId as GithubId);
      return {
        email: user.email,
        emailVerified: user.emailVerified ?? null,
        id: user.id,
      };
    },

    async createUser(adapterUser) {
      const user = await createUser({
        email: adapterUser.email,
        githubId: undefined!, // ??
        emailVerified: null,
        username: adapterUser.name ?? `user-${nanoid(8)}`,
      });
      return user;
    },

    async getUser(userId) {
      const user = await getUser(userId as UserId);
      if (!user) {
        return null;
      }
      return user;
    },

    async getUserByEmail(email) {
      const user = await getUserByEmail(email);
      if (!user) {
        return null;
      }
      return user;
    },

    async updateUser(user) {
      const existingUser = await getUser(user.id as UserId);
      if (existingUser == null) {
        throw new Error(`User with id ${user.id} not found`);
      }

      existingUser.email = user.email ?? existingUser.email;
      existingUser.emailVerified = user.emailVerified ?? existingUser.emailVerified;

      await setUser(existingUser);

      return existingUser;
    },

    async linkAccount(account) {
      await findOrCreateByGithub(account.providerAccountId as GithubId);
      return account;
    },

    async getSessionAndUser(sessionToken) {
      const session = await kv.get<DbSession>(`session:by-token:${sessionToken}`);

      if (!session) {
        return null;
      }

      const user = await getUser(session.userId as UserId);

      if (!user) {
        return null;
      }

      return {
        session: {
          expires: new Date(session.expires),
          sessionToken,
          userId: session.userId,
        },
        user,
      };
    },

    async updateSession(session) {
      const existingSession = await kv.get<DbSession>(`session:by-token:${session.sessionToken}`);

      if (!existingSession) {
        throw new Error(`Session with token ${session.sessionToken} not found`);
      }

      existingSession.expires = session.expires ? session.expires.valueOf() : existingSession.expires;
      existingSession.userId = session.userId ?? existingSession.userId;

      await kv.set(`session:by-token:${session.sessionToken}`, existingSession);
      await kv.set(`session:by-user:${session.userId}`, existingSession);

      return {
        ...existingSession,
        expires: new Date(existingSession.expires),
      };
    },
  };
}
