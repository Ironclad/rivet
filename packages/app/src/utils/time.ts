/** A number of milliseconds (1/1000 of a second). */
export type Milliseconds = number & { __milliseconds: any };

/** Returns a number of milliseconds, strongly typed. */
export const ms = (numMilliseconds: number) => numMilliseconds as Milliseconds;

/** Returns a number of seconds, as milliseconds. */
export const seconds = (numSeconds: number) => ms(numSeconds * 1000);

/** Returns a number of minutes, as milliseconds. */
export const minutes = (numMinutes: number) => seconds(numMinutes * 60);

/** Returns a number of hours, as milliseconds. */
export const hours = (numHours: number) => minutes(numHours * 60);

/** Returns a number of days, as milliseconds. */
export const days = (numDays: number) => hours(numDays * 24);

/** A count of microseconds (1/1000) of a millisecond). */
export type Microseconds = number & { __microseconds: any };

/** Returns a number of microseconds, strongly typed. To type a µ, press option+m on mac os. */
export const µs = (numMicroseconds: number) => numMicroseconds as Microseconds;

export const µsToMs = (numMicroseconds: Microseconds) => ms(numMicroseconds / 1000);

export const msToµs = (numMilliseconds: Milliseconds) => µs(numMilliseconds * 1000);
