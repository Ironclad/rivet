/** A number of milliseconds (1/1000 of a second). */
export type Milliseconds = number & {
    __milliseconds: any;
};
/** Returns a number of milliseconds, strongly typed. */
export declare const ms: (numMilliseconds: number) => Milliseconds;
/** Returns a number of seconds, as milliseconds. */
export declare const seconds: (numSeconds: number) => Milliseconds;
/** Returns a number of minutes, as milliseconds. */
export declare const minutes: (numMinutes: number) => Milliseconds;
/** Returns a number of hours, as milliseconds. */
export declare const hours: (numHours: number) => Milliseconds;
/** Returns a number of days, as milliseconds. */
export declare const days: (numDays: number) => Milliseconds;
/** A count of microseconds (1/1000) of a millisecond). */
export type Microseconds = number & {
    __microseconds: any;
};
/** Returns a number of microseconds, strongly typed. To type a µ, press option+m on mac os. */
export declare const µs: (numMicroseconds: number) => Microseconds;
export declare const µsToMs: (numMicroseconds: Microseconds) => Milliseconds;
export declare const msToµs: (numMilliseconds: Milliseconds) => Microseconds;
