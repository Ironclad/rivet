import { expectType } from '..';
import { WarningsPort } from './symbols';
export function addWarning(outputs, warning) {
    if (!outputs[WarningsPort]) {
        outputs[WarningsPort] = { type: 'string[]', value: [] };
    }
    outputs[WarningsPort].value.push(warning);
}
export function getWarnings(outputs) {
    if (!outputs?.[WarningsPort]) {
        return undefined;
    }
    return expectType(outputs[WarningsPort], 'string[]');
}
