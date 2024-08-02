import type { AudioDataValue } from '../model/DataValue.js';

export interface AudioProvider {
  playAudio(audio: AudioDataValue, abort: AbortSignal): Promise<void>;
}
