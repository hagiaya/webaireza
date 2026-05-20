'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { 
  Play, Pause, Volume2, VolumeX, 
  Download, X, Music, Mic 
} from 'lucide-react';

export default function GlobalAudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    duration, 
    currentTime, 
    volume, 
    togglePlay, 
    setTrackTime, 
    changeVolume,
    pauseTrack
  } = useAudio();

  if (!currentTrack) return null;

  // Format time (e.g., 35 -> "0:35")
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackTime(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeVolume(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    changeVolume(volume > 0 ? 0 : 0.8);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel-glow border-t border-purple-500/20 px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 animate-slide-up">
      {/* Track Info */}
      <div className="flex items-center gap-3 w-full md:w-1/4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg relative overflow-hidden flex-shrink-0">
          <Music className="w-5 h-5 relative z-10" />
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          {isPlaying && (
            <div className="absolute bottom-1 left-2 right-2 flex items-end justify-center gap-0.5 h-3">
              <span className="w-0.5 h-full bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }}></span>
              <span className="w-0.5 h-2/3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.4s' }}></span>
              <span className="w-0.5 h-full bg-white rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.5s' }}></span>
              <span className="w-0.5 h-1/2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.7s' }}></span>
            </div>
          )}
        </div>
        <div className="overflow-hidden min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{currentTrack.title}</h4>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 truncate mt-0.5">
            <Mic className="w-3.5 h-3.5 text-pink-500" />
            Suara Ara ({currentTrack.voice || 'nova'})
          </p>
        </div>
      </div>

      {/* Main Controls & Progress */}
      <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:scale-105 transition-all shadow-md"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-zinc-950" />
            ) : (
              <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 w-full text-xs text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <input 
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleTimeChange}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Utility Actions */}
      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-1/4">
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
            {volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
          <input 
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 md:w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
          <a 
            href={currentTrack.file_url} 
            download={currentTrack.file_name || `${currentTrack.title}.mp3`}
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
            title="Download MP3"
          >
            <Download className="w-4 h-4" />
          </a>
          <button 
            onClick={pauseTrack} 
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
            title="Tutup Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
