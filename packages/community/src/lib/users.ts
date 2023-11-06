import { kv } from '@vercel/kv';
import { Opaque } from 'type-fest';
import { nanoid } from 'nanoid';

export type UserId = Opaque<string, 'UserId'>;

export type GithubId = Opaque<string, 'GithubId'>;

export type UserKey = `user:${UserId}`;

export type User = {
  id: UserId;
  username: string;
  email: string;
  emailVerified: Date | null;
  githubId: string;

  displayName?: string;
};

export async function getUser(userId: UserId): Promise<User | undefined> {
  const user = await kv.get<User>(`user:${userId}`);

  if (!user) {
    return undefined;
  }

  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const userId = await kv.get<UserId>(`user:email:${email}`);

  if (!userId) {
    return undefined;
  }

  const user = await getUser(userId);

  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }

  return user;
}

export async function setUser(user: User): Promise<void> {
  await kv.set(`user:${user.id}`, user);
  await kv.set(`user:email:${user.email}`, user.id);
}

export async function findOrCreateByGithub(githubId: GithubId): Promise<User> {
  const userId = await kv.get<UserId>(`user:github:${githubId}`);

  if (userId) {
    const user = await getUser(userId);

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    return user;
  }

  const user = await createUserByGithub(githubId);

  return user;
}

export async function createUserByGithub(githubId: GithubId, githubUsername?: string) {
  const userDefaultName = githubUsername ?? `user-${nanoid(8)}`;
  const newUser: User = {
    id: nanoid() as UserId,
    email: '',
    githubId,
    emailVerified: null,
    username: userDefaultName,
  };

  await setUser(newUser);
  await kv.set(`user:github:${newUser.githubId}`, newUser.id);

  return newUser;
}

export async function createUser(user: Omit<User, 'id'>) {
  const newUser = {
    id: nanoid() as UserId,
    ...user,
  };
  await setUser(newUser);
  return newUser;
}
