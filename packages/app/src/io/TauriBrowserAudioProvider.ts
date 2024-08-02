import { type AudioDataValue, type AudioProvider } from '@ironclad/rivet-core';

export class TauriBrowserAudioProvider implements AudioProvider {
  async playAudio(audio: AudioDataValue, abort: AbortSignal): Promise<void> {
    const blob = new Blob([audio.value.data], { type: audio.value.mediaType ?? 'audio/wav' });
    const audioNode = new Audio(URL.createObjectURL(blob));

    const finished = new Promise<void>((resolve, reject) => {
      audioNode.onended = () => {
        resolve();
      };

      abort.onabort = () => {
        audioNode.pause();
        reject(new Error('Audio playback aborted'));
      };
    });

    await audioNode.play();

    return finished;
  }
}
