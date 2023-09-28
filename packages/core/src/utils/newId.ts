import { nanoid } from 'nanoid/non-secure';

export function newId<T extends string>(): T {
  return nanoid() as T;
}
