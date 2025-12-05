import React, { useState, useRef } from 'react';
import { AudioSegment } from '../types';
import { decodeAudioFile, splitAudioBuffer, audioBufferToWav } from '../utils/audioUtils';
import { Upload, Scissors, Download, Play, Pause, Loader2, Archive, Music } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';
import JSZip from 'jszip';
import { useLanguage } from '../contexts/LanguageContext';

const ModuleSplitter: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [threshold, setThreshold] = useState(-30); // dB
  const [minSilence, setMinSilence] = useState(0.5); // seconds
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setIsProcessing(true);
      try {
        const buf = await decodeAudioFile(f);
        setBuffer(buf);
        setSegments([]);
      } catch (err) {
        console.error("Error decoding", err);
        alert("Could not decode audio file.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const processSplit = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    // Yield to UI to show loader
    setTimeout(async () => {
      try {
        const buffers = await splitAudioBuffer(buffer, threshold, minSilence);
        const newSegments: AudioSegment[] = buffers.map((b, i) => ({
          id: `seg-${i}-${Date.now()}`,
          buffer: b,
          duration: b.duration,
          blob: audioBufferToWav(b),
          name: `${file?.name.split('.')[0]}_part_${i + 1}.wav`
        }));
        setSegments(newSegments);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const playSegment = (segment: AudioSegment) => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }
    
    if (playingId === segment.id) {
      setPlayingId(null);
      return;
    }

    const url = URL.createObjectURL(segment.blob);
    audioRef.current = new Audio(url);
    audioRef.current.onended = () => setPlayingId(null);
    audioRef.current.play();
    setPlayingId(segment.id);
  };

  const downloadSegment = (segment: AudioSegment) => {
    const url = URL.createObjectURL(segment.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = segment.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDownload = async () => {
    if (segments.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      segments.forEach(seg => {
        zip.file(seg.name, seg.blob);
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file?.name.split('.')[0]}_splits.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Zip error", e);
      alert("Failed to create zip file");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
       {/* Decorative */}
       <div className="absolute -right-10 top-20 text-8xl opacity-10 transform -rotate-12 pointer-events-none">🥐</div>

      {/* Header Section */}
      <div className="paper-card bg-surface p-8 relative overflow-hidden">
        {/* Tape Effect */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-yellow-100/50 rotate-1 border border-white/40 shadow-sm z-10 backdrop-blur-sm"></div>

        <h2 className="text-3xl font-display font-bold text-text mb-4 flex items-center gap-3 relative z-10">
           <div className="bg-primary/10 p-2 rounded-full"><Scissors className="text-primary w-6 h-6" /></div>
           {t.splitter.title}
        </h2>
        <p className="text-gray-600 mb-8 font-hand text-lg relative z-10">
          {t.splitter.description}
        </p>
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <label className="group flex flex-col items-center justify-center w-full md:w-72 h-48 border-4 border-dashed border-outline/30 rounded-3xl cursor-pointer hover:bg-orange-50 hover:border-primary/50 transition-all transform hover:-rotate-1 relative bg-white">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
              <div className="bg-orange-100 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-base text-gray-600 font-bold font-display">
                {t.splitter.uploadTitle} <span className="text-primary font-normal font-hand">{t.splitter.uploadDrag}</span>
              </p>
              <p className="text-xs text-gray-400 font-bold mt-1 bg-gray-100 px-2 py-1 rounded-full">{t.splitter.uploadHint}</p>
            </div>
            <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
          </label>

          {file && (
            <div className="flex-1 w-full space-y-6 bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-inner">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="bg-primary text-white p-2 rounded-lg"><Music className="w-4 h-4"/></div>
                   <h3 className="font-bold text-lg text-text truncate max-w-xs">{file.name}</h3>
                </div>
                <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                  {buffer ? `${buffer.duration.toFixed(2)}s` : t.splitter.loading}
                </span>
              </div>
              
              {buffer && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <WaveformVisualizer buffer={buffer} height={80} color="#FF7043" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-500">{t.splitter.threshold}</span>
                    <span className="text-primary bg-primary/10 px-2 rounded">{threshold} dB</span>
                  </div>
                  <input 
                    type="range" min="-60" max="0" value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-500">{t.splitter.minSilence}</span>
                    <span className="text-primary bg-primary/10 px-2 rounded">{minSilence} s</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="5" step="0.1" value={minSilence}
                    onChange={(e) => setMinSilence(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={processSplit}
                  disabled={isProcessing}
                  className="btn-sketch bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-md transition-all active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full md:w-auto justify-center"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5"/> : t.splitter.processBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {segments.length > 0 && (
        <div className="paper-card bg-surface p-8 border-t-8 border-t-secondary/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-2xl text-text font-display font-bold flex items-center gap-2">
              <span className="bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm">{segments.length}</span>
              {t.splitter.foundSegments.replace('{count}', '')}
            </h3>
            <button 
              onClick={handleBulkDownload}
              disabled={isZipping}
              className="btn-sketch flex items-center gap-2 bg-white text-primary border-2 border-primary hover:bg-orange-50 px-5 py-2 rounded-xl font-bold transition-colors text-sm"
            >
               {isZipping ? <Loader2 className="w-4 h-4 animate-spin"/> : <Archive className="w-4 h-4" />}
               {t.splitter.downloadAll}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segments.map((seg, idx) => (
              <div key={seg.id} className="group bg-white hover:bg-orange-50 border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl p-4 transition-all flex items-center gap-4 relative">
                
                <button
                  onClick={() => playSegment(seg)}
                  className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition-colors border-2 ${playingId === seg.id ? 'bg-primary border-primary text-white' : 'bg-white border-gray-100 text-primary hover:bg-primary hover:text-white'}`}
                >
                  {playingId === seg.id ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-text truncate font-display">{t.splitter.part} {idx + 1}</p>
                  <p className="text-xs font-bold text-gray-400 bg-gray-100 inline-block px-2 rounded-full">{seg.duration.toFixed(2)}s</p>
                  <div className="mt-2 h-10 w-full opacity-80">
                     <WaveformVisualizer buffer={seg.buffer} height={40} color={playingId === seg.id ? '#d35400' : '#cfd8dc'} />
                  </div>
                </div>

                <button 
                  onClick={() => downloadSegment(seg)}
                  className="p-3 text-gray-400 hover:text-primary hover:bg-orange-100 rounded-xl transition-colors"
                  title="Download"
                >
                  <Download className="w-6 h-6" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleSplitter;