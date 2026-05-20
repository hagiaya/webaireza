'use client';

import React from 'react';
import { 
  Play, Pause, Mic, Download, 
  Calendar, FileText, Activity 
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAudio } from '@/context/AudioContext';

interface AudioCardProps {
  audio: {
    id: string;
    script_id: string;
    file_url: string;
    file_name: string;
    voice?: string;
    duration?: number;
    status: string;
    created_at?: string;
  };
  script?: {
    title: string;
    content: string;
  } | null;
  onDelete?: (id: string) => void;
  onSchedule?: (script: any, audioId: string) => void;
}

export default function AudioCard({ 
  audio, 
  script, 
  onDelete, 
  onSchedule 
}: AudioCardProps) {
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const isCurrentPlaying = currentTrack?.id === audio.id && isPlaying;

  const handlePlayClick = () => {
    if (audio.file_url) {
      playTrack({
        id: audio.id,
        file_url: audio.file_url,
        title: script?.title || audio.file_name,
        voice: audio.voice || 'nova',
        script_content: script?.content || ''
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 border transition-all ${
      isCurrentPlaying 
        ? 'border-pink-500/40 bg-zinc-900/60 shadow-[0_0_20px_rgba(236,72,153,0.1)]' 
        : 'border-zinc-800 hover:border-zinc-700/80'
    } relative overflow-hidden group`}>
      {/* Visual background lines */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex items-start gap-4">
        {/* Play Circle Icon */}
        <button 
          onClick={handlePlayClick}
          disabled={audio.status !== 'generated'}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
            audio.status !== 'generated'
              ? 'bg-zinc-800/40 text-zinc-600 border border-zinc-800'
              : isCurrentPlaying 
                ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg animate-pulse shadow-pink-500/20'
                : 'bg-purple-950/40 text-purple-400 border border-purple-800/40 hover:bg-purple-900/30 hover:scale-105'
          }`}
        >
          {isCurrentPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Audio Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={audio.status} type="audio" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400 bg-pink-950/20 px-2 py-0.5 border border-pink-900/30 rounded">
              Voice: {audio.voice || 'nova'}
            </span>
          </div>

          <h3 className="text-base font-bold text-white mt-2 truncate group-hover:text-purple-300 transition-colors">
            {script?.title || audio.file_name}
          </h3>

          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Dibuat: {formatDate(audio.created_at)}
          </p>
        </div>
      </div>

      {/* Script snippet */}
      {script?.content && (
        <div className="mt-4 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/60 text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {script.content}
        </div>
      )}

      {/* Footer info & secondary action */}
      <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3.5 mt-4 text-xs font-semibold">
        <div className="text-zinc-500 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" />
          Durasi: <span className="text-zinc-300 font-bold">{audio.duration || 0} detik</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download */}
          {audio.status === 'generated' && (
            <a 
              href={audio.file_url}
              download={audio.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60 transition-all flex items-center gap-1"
              title="Unduh MP3"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh</span>
            </a>
          )}

          {/* Schedule quick option */}
          {onSchedule && script && audio.status === 'generated' && (
            <button 
              onClick={() => onSchedule(script, audio.id)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-950/20"
            >
              Jadwalkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
