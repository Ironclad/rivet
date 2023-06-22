/** Returns a number of milliseconds, strongly typed. */
export const ms = (numMilliseconds) => numMilliseconds;
/** Returns a number of seconds, as milliseconds. */
export const seconds = (numSeconds) => ms(numSeconds * 1000);
/** Returns a number of minutes, as milliseconds. */
export const minutes = (numMinutes) => seconds(numMinutes * 60);
/** Returns a number of hours, as milliseconds. */
export const hours = (numHours) => minutes(numHours * 60);
/** Returns a number of days, as milliseconds. */
export const days = (numDays) => hours(numDays * 24);
/** Returns a number of microseconds, strongly typed. To type a µ, press option+m on mac os. */
export const µs = (numMicroseconds) => numMicroseconds;
export const µsToMs = (numMicroseconds) => ms(numMicroseconds / 1000);
export const msToµs = (numMilliseconds) => µs(numMilliseconds * 1000);
