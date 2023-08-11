import { NodeRegistration } from './NodeRegistration.js';

export type RivetPlugin = {
  id: string;
  register: (registration: NodeRegistration) => void;
};
