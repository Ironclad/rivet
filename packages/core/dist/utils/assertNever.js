export function assertNever(x) {
    throw new Error(`Unexpected object: ${x}`);
}
