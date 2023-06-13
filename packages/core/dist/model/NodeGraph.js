import { nanoid } from 'nanoid';
export function emptyNodeGraph() {
    return {
        nodes: [],
        connections: [],
        metadata: {
            id: nanoid(),
            name: 'Untitled Graph',
            description: '',
        },
    };
}
