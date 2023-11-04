import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { Adapter } from './adapter';
import { UserId } from './users';

declare module 'next-auth' {
  interface Session {
    user: {
      id: UserId;
    };
  }
}

const { handlers, auth } = NextAuth({
  providers: [GitHub],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id as UserId,
        },
      };
    },
  },
  adapter: Adapter(),
});

export { auth };
export const { GET, POST } = handlers;
