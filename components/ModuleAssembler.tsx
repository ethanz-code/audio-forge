import React, { useState, useRef, useEffect } from 'react';
import { AudioTrack } from '../types';
import { decodeAudioFile, mergeAudioTracks, getAudioContext } from '../utils/audioUtils';
import { Plus, Clock, Trash2, Download, Music, Loader2, Play, Pause, FolderInput, FileAudio, GripVertical } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#54A0FF', '#5F27CD'];

const ModuleAssembler: React.FC = () => {
  const { t } = useLanguage();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dragging State
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    activeId: string;
    startX: number;
    initialStartTime: number;
    lockedScale: number;
  } | null>(null);

  // Playback state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Stop playing when component unmounts
  useEffect(() => {
    return () => {
      if (activeSourceRef.current) {
        activeSourceRef.current.stop();
      }
    };
  }, []);

  // -- Drag & Drop Logic with Smart Push --
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !timelineRef.current) return;
      e.preventDefault();

      const rect = timelineRef.current.getBoundingClientRect();
      const pixelDelta = e.clientX - dragState.startX;
      // Convert pixels to seconds using the locked scale from drag start
      const timeDelta = (pixelDelta / rect.width) * dragState.lockedScale;
      
      const newStartTime = Math.max(0, dragState.initialStartTime + timeDelta);

      setTracks(prev => {
        // 1. Update the dragged track in a copy of the array
        let nextTracks = prev.map(t => 
          t.id === dragState.activeId ? { ...t, startTime: newStartTime } : t
        );

        // 2. Sort tracks by start time to handle collisions in order
        nextTracks.sort((a, b) => a.startTime - b.startTime);

        // 3. Resolve Collisions (Push Logic)
        // If Track A overlaps Track B, push Track B to the right.
        for (let i = 0; i < nextTracks.length - 1; i++) {
          const current = nextTracks[i];
          const next = nextTracks[i + 1];
          
          const currentEnd = current.startTime + current.duration;
          
          // If the current track ends after the next one starts, push the next one
          if (currentEnd > next.startTime) {
             next.startTime = currentEnd;
             // Determine if we need to continue the chain? 
             // Since we iterate i from 0 to N, modifying next (i+1) will affect the next iteration (i+1 vs i+2),
             // so the push will propagate correctly through the chain.
          }
        }

        return nextTracks;
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  const handleTimelineMouseDown = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!timelineRef.current) return;

    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    setDragState({
      activeId: trackId,
      startX: e.clientX,
      initialStartTime: track.startTime,
      lockedScale: timelineScale
    });
  };

  // Helper to calculate total duration of current timeline
  const getTotalDuration = (currentTracks: AudioTrack[]) => {
    if (currentTracks.length === 0) return 0;
    return Math.max(...currentTracks.map(t => t.startTime + t.duration));
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    const newTracks: AudioTrack[] = [];
    
    // Calculate where to append: end of the very last track + small gap? 
    // Or just tight pack.
    let currentEnd = getTotalDuration(tracks);

    const fileArray = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

    try {
      for (const file of fileArray) {
        if (!file.type.startsWith('audio/')) continue;

        try {
          const buffer = await decodeAudioFile(file);
          const newTrack: AudioTrack = {
            id: `track-${Date.now()}-${Math.random()}`,
            file,
            buffer,
            startTime: currentEnd,
            duration: buffer.duration,
            color: COLORS[(tracks.length + newTracks.length) % COLORS.length]
          };
          newTracks.push(newTrack);
          currentEnd += buffer.duration;
        } catch (e) {
          console.error(`Failed to decode ${file.name}`, e);
        }
      }
      
      if (newTracks.length > 0) {
        setTracks(prev => [...prev, ...newTracks]);
      } else {
        alert(t.assembler.errorLoad);
      }

    } catch (err) {
      console.error(err);
      alert(t.assembler.errorLoad);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = ''; 
  };

  const playTrack = async (track: AudioTrack) => {
    if (activeSourceRef.current) {
      activeSourceRef.current.stop();
      activeSourceRef.current = null;
    }

    if (playingTrackId === track.id) {
      setPlayingTrackId(null);
      return;
    }

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = track.buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        // Only clear if this specific source ended naturally (not stopped by us starting another)
        // However, we just check if it matches activeSourceRef
        if (activeSourceRef.current === source) {
           setPlayingTrackId(null);
           activeSourceRef.current = null;
        }
      };

      source.start();
      activeSourceRef.current = source;
      setPlayingTrackId(track.id);

    } catch (e) {
      console.error("Playback error", e);
    }
  };

  const updateTrackTime = (id: string, newTime: number) => {
    // Manual input update should also respect push logic
    setTracks(prev => {
      let nextTracks = prev.map(t => 
        t.id === id ? { ...t, startTime: newTime } : t
      );
      
      // Sort and Push
      nextTracks.sort((a, b) => a.startTime - b.startTime);
      
      for (let i = 0; i < nextTracks.length - 1; i++) {
        const current = nextTracks[i];
        const next = nextTracks[i + 1];
        if (current.startTime + current.duration > next.startTime) {
           next.startTime = current.startTime + current.duration;
        }
      }
      
      return nextTracks;
    });
  };

  const removeTrack = (id: string) => {
    if (playingTrackId === id && activeSourceRef.current) {
      activeSourceRef.current.stop();
      setPlayingTrackId(null);
    }
    setTracks(tracks.filter(t => t.id !== id));
  };

  const handleExport = async () => {
    if (tracks.length === 0) return;

    setIsProcessing(true);
    try {
      const blob = await mergeAudioTracks(tracks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${t.assembler.exportSuccess}_${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine scale (zoom)
  const maxDuration = getTotalDuration(tracks);
  // Use locked scale if dragging to prevent UI jumping during interaction
  const timelineScale = dragState ? dragState.lockedScale : (maxDuration > 0 ? maxDuration * 1.1 : 10);

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Decorative */}
      <div className="absolute -right-4 -top-8 text-6xl opacity-20 transform rotate-12">🧁</div>
      <div className="absolute -left-4 top-1/2 text-6xl opacity-20 transform -rotate-12">🥖</div>

      {/* Header */}
      <div className="paper-card bg-surface p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8 border-b-2 border-dashed border-outline/30 pb-6">
          <div>
            <h2 className="text-3xl font-display font-bold text-text flex items-center gap-3">
              <Clock className="text-primary w-8 h-8" /> {t.assembler.title}
            </h2>
            <p className="text-gray-600 mt-2 font-medium text-lg font-hand">
              {t.assembler.description}
            </p>
          </div>
          
          <div className="flex gap-4 flex-wrap items-center">
             <div className="flex gap-2">
                <label className="btn-sketch bg-white px-4 py-2 text-primary font-bold cursor-pointer flex items-center gap-2 hover:bg-orange-50">
                  <Plus className="w-5 h-5" />
                  {t.assembler.addFiles}
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    accept="audio/*" 
                    onChange={handleFileChange} 
                  />
                </label>
                
                <label className="btn-sketch bg-white px-4 py-2 text-primary font-bold cursor-pointer flex items-center gap-2 hover:bg-orange-50" title="Upload Folder">
                  <FolderInput className="w-5 h-5" />
                  {t.assembler.addFolder}
                  <input 
                    type="file" 
                    {...({webkitdirectory: "", mozdirectory: ""} as any)}
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
             </div>

             <div className="h-8 w-px bg-outline/30 mx-2 hidden md:block"></div>

             <button 
                onClick={handleExport}
                disabled={tracks.length === 0 || isProcessing}
                className="btn-sketch bg-primary text-white px-6 py-2 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5"/> : <Download className="w-5 h-5" />}
                {t.assembler.exportMix}
             </button>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div 
          ref={timelineRef}
          className="relative w-full h-48 bg-white border-2 border-outline rounded-xl overflow-hidden mb-8 shadow-inner select-none"
        >
           {/* Background Grid */}
           <div className="absolute inset-0 bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0),linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] opacity-30 pointer-events-none"></div>
           
           {/* Time markers grid */}
           <div className="absolute inset-0 flex z-0 pointer-events-none">
             {[...Array(10)].map((_, i) => (
               <div key={i} className="flex-1 border-r-2 border-dashed border-gray-200 h-full relative">
                 <span className="absolute bottom-2 right-1 text-xs font-bold text-gray-400">
                   {(timelineScale * (i+1) / 10).toFixed(1)}s
                 </span>
               </div>
             ))}
           </div>

           {tracks.map((t) => {
             const left = (t.startTime / timelineScale) * 100;
             const width = (t.duration / timelineScale) * 100;
             const isActive = playingTrackId === t.id;
             const isDragging = dragState?.activeId === t.id;
             
             return (
               <div 
                  key={t.id}
                  onMouseDown={(e) => handleTimelineMouseDown(e, t.id)}
                  className={`absolute top-10 h-24 rounded-lg shadow-md border-2 border-black/20 flex flex-col items-center justify-center text-xs md:text-sm text-white font-bold truncate px-2 transition-transform 
                    ${isDragging ? 'z-50 cursor-grabbing scale-105 shadow-xl ring-4 ring-white ring-opacity-50' : 'cursor-grab hover:z-30 hover:scale-105'}
                    ${isActive ? 'ring-2 ring-white ring-offset-2' : ''}
                  `}
                  style={{ 
                    left: `${left}%`, 
                    width: `${width}%`, 
                    backgroundColor: t.color,
                    minWidth: '2px' 
                  }}
                  title={`${t.file.name} (${t.startTime.toFixed(1)}s - ${(t.startTime + t.duration).toFixed(1)}s)`}
               >
                  <GripVertical className="w-4 h-4 opacity-50 mb-1" />
                  <span className="drop-shadow-md truncate w-full text-center">{t.file.name}</span>
               </div>
             )
           })}
        </div>

        {/* Track List Control */}
        <div className="space-y-4">
          {tracks.map((track, idx) => {
            const prevTrackEnd = idx > 0 ? tracks[idx-1].startTime + tracks[idx-1].duration : 0;
            const isPlaying = playingTrackId === track.id;

            return (
              <div key={track.id} className="relative group">
                <div className="absolute -inset-0.5 bg-gray-200 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border-2 border-dashed border-outline/30 hover:border-primary transition-all">
                  
                  {/* Index / Color Badge */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm border-2 border-white" style={{ backgroundColor: track.color }}>
                    {idx + 1}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <FileAudio className="w-5 h-5 text-gray-400" />
                       <h4 className="font-bold text-text text-lg truncate font-display">{track.file.name}</h4>
                    </div>
                    <p className="text-sm text-gray-500 font-bold ml-7">{t.assembler.duration}: <span className="text-primary">{track.duration.toFixed(2)}s</span></p>
                  </div>

                  {/* Play Control */}
                   <button 
                    onClick={() => playTrack(track)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-2 ${isPlaying ? 'bg-primary border-primary text-white' : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-primary hover:text-white hover:border-primary'}`}
                    title={isPlaying ? "Pause" : "Play Preview"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </button>

                  {/* Timing & Controls */}
                  <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 bg-gray-50 p-2 rounded-xl border border-gray-100">
                     <div className="flex flex-col items-start">
                       <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1 px-1">{t.assembler.startTime}</label>
                       <div className="flex items-center gap-2">
                         <input 
                            type="number" 
                            step="0.1" 
                            min="0"
                            value={Number(track.startTime.toFixed(2))}
                            onChange={(e) => updateTrackTime(track.id, Number(e.target.value))}
                            className="w-24 bg-white border-2 border-gray-200 rounded-lg px-2 py-1 focus:border-primary focus:ring-0 outline-none text-base font-bold text-center"
                         />
                         {idx > 0 && Math.abs(track.startTime - prevTrackEnd) < 0.05 && (
                           <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold border border-green-200">SYNC</span>
                         )}
                       </div>
                     </div>

                     <div className="w-px h-8 bg-gray-200"></div>

                     <button 
                       onClick={() => removeTrack(track.id)}
                       className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {tracks.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white/50 rounded-3xl border-4 border-dashed border-outline/20">
               <Music className="w-16 h-16 mx-auto mb-4 text-gray-300 opacity-50" />
               <p className="text-xl font-display font-bold text-gray-500">{t.assembler.noTracks}</p>
               <p className="text-sm mt-2 font-hand">{t.assembler.uploadHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleAssembler;