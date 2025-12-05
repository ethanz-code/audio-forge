export interface AudioSegment {
  id: string;
  buffer: AudioBuffer;
  duration: number;
  blob: Blob;
  name: string;
}

export interface AudioTrack {
  id: string;
  file: File;
  buffer: AudioBuffer;
  startTime: number; // In seconds
  duration: number; // In seconds
  color: string;
}

export enum ModuleType {
  SPLITTER = 'SPLITTER',
  ASSEMBLER = 'ASSEMBLER',
}

export interface ProcessingOptions {
  threshold: number; // -100 to 0 dB
  minSilenceDuration: number; // Seconds
}

export type Language = 'en' | 'zh' | 'ja';
