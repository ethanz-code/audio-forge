/**
 * Utility functions for Web Audio API operations.
 */

// Global context handling to prevent running out of contexts
let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const decodeAudioFile = async (file: File): Promise<AudioBuffer> => {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
};

export const bufferToWaveform = (buffer: AudioBuffer, samples: number = 100): number[] => {
  const rawData = buffer.getChannelData(0);
  const blockSize = Math.floor(rawData.length / samples);
  const filteredData = [];
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[i * blockSize + j]);
    }
    filteredData.push(sum / blockSize);
  }
  // Normalize
  const max = Math.max(...filteredData);
  return filteredData.map(n => n / (max || 1));
};

export const splitAudioBuffer = async (
  buffer: AudioBuffer,
  thresholdDb: number,
  minSilenceDur: number
): Promise<AudioBuffer[]> => {
  const rawData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const threshold = Math.pow(10, thresholdDb / 20); // Convert dB to amplitude
  const minSilenceSamples = minSilenceDur * sampleRate;
  
  const segments: { start: number; end: number }[] = [];
  let isSilent = true;
  let segmentStart = 0;
  let silenceStart = 0;

  for (let i = 0; i < rawData.length; i++) {
    const amplitude = Math.abs(rawData[i]);

    if (amplitude > threshold) {
      if (isSilent) {
        // Sound starts here
        isSilent = false;
        // If the gap was long enough, the previous part was a valid segment end
        // But actually, we are looking for valid SOUND segments.
        // If we were tracking silence, we reset.
        
        // Complex logic simplified:
        // We are strictly looking for "sound".
        // If we have been silent for > minSilenceSamples, the previous sound ended at silenceStart.
        
        if (i - silenceStart > minSilenceSamples && segmentStart < silenceStart) {
             // Valid segment found from segmentStart to silenceStart
             if (silenceStart - segmentStart > sampleRate * 0.1) { // Min 0.1s segment
                 segments.push({ start: segmentStart, end: silenceStart });
             }
             segmentStart = i; // New segment starts now
        }
      }
    } else {
      if (!isSilent) {
        isSilent = true;
        silenceStart = i;
      }
    }
  }

  // Handle last segment
  if (!isSilent || (rawData.length - silenceStart < minSilenceSamples)) {
     segments.push({ start: segmentStart, end: rawData.length });
  } else if (silenceStart > segmentStart) {
     segments.push({ start: segmentStart, end: silenceStart });
  }

  // Create buffers
  const resultBuffers: AudioBuffer[] = [];
  for (const seg of segments) {
    const length = seg.end - seg.start;
    if (length <= 0) continue;
    
    const newBuffer = getAudioContext().createBuffer(
      buffer.numberOfChannels,
      length,
      sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);
      // Faster copy
      newChannelData.set(channelData.subarray(seg.start, seg.end));
    }
    resultBuffers.push(newBuffer);
  }
  
  return resultBuffers;
};

export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this example)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArray], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

export const mergeAudioTracks = async (tracks: { buffer: AudioBuffer; startTime: number }[]): Promise<Blob> => {
  if (tracks.length === 0) throw new Error("No tracks to merge");

  // Calculate total duration
  let totalDuration = 0;
  tracks.forEach(t => {
    const end = t.startTime + t.buffer.duration;
    if (end > totalDuration) totalDuration = end;
  });

  const ctx = new OfflineAudioContext(
    2, // Stereo output
    Math.ceil(totalDuration * 44100),
    44100
  );

  tracks.forEach(track => {
    const source = ctx.createBufferSource();
    source.buffer = track.buffer;
    source.connect(ctx.destination);
    source.start(track.startTime);
  });

  const renderedBuffer = await ctx.startRendering();
  return audioBufferToWav(renderedBuffer);
};
