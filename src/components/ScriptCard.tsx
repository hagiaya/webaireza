'use client';

import React, { useState } from 'react';
import { 
  Clock, Trash2, Edit3, Sparkles, 
  Volume2, Calendar, ChevronDown, ChevronUp 
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAudio } from '@/context/AudioContext';

interface ScriptCardProps {
  script: {
    id: string;
    title: string;
    content: string;
    hook?: string;
    cta?: string;
    duration_estimate?: number;
    slot?: number;
    status: string;
    category?: string;
    created_at?: string;
  };
  audio?: {
    id: string;
    file_url: string;
    voice?: string;
    status: string;
  } | null;
  onEdit?: (script: any) => void;
  onDelete?: (id: string) => void;
  onGenerateAudio?: (scriptId: string) => void;
  onSchedule?: (script: any, audioId: string | null) => void;
}

export default function ScriptCard({ 
  script, 
  audio, 
  onEdit, 
  onDelete, 
  onGenerateAudio, 
  onSchedule 
}: ScriptCardProps) {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [expanded, setExpanded] = useState(false);

  const getSlotLabel = (slotNum?: number) => {
    switch (slotNum) {
      case 1: return 'Pagi (07:00)';
      case 2: return 'Siang (12:00)';
      case 3: return 'Malam (19:00)';
      default: return 'Pagi (07:00)';
    }
  };

  const getCategoryColor = (cat?: string) => {
    const c = cat?.toLowerCase() || '';
    if (c === 'html') return 'text-orange-400 bg-orange-950/20 border-orange-800/30';
    if (c === 'css') return 'text-blue-400 bg-blue-950/20 border-blue-800/30';
    if (c === 'javascript' || c === 'js') return 'text-yellow-400 bg-yellow-950/20 border-yellow-800/30';
    if (c === 'react') return 'text-cyan-400 bg-cyan-950/20 border-cyan-800/30';
    if (c === 'python') return 'text-green-400 bg-green-950/20 border-green-800/30';
    return 'text-purple-400 bg-purple-950/20 border-purple-800/30';
  };

  const isCurrentAudioPlaying = audio && currentTrack?.id === audio.id && isPlaying;

  const handleAudioPlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audio?.file_url) {
      playTrack({
        id: audio.id,
        file_url: audio.file_url,
        title: script.title,
        voice: audio.voice || 'nova',
        script_content: script.content
      });
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-zinc-800 card-hover-glow relative overflow-hidden group">
      {/* Category Indicator Corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent pointer-events-none rounded-tr-2xl"></div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative z-10 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border ${getCategoryColor(script.category)}`}>
              {script.category || 'coding'}
            </span>
            <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {getSlotLabel(script.slot)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-purple-300 transition-colors">
            {script.title}
          </h3>
        </div>
        <StatusBadge status={script.status} type="script" />
      </div>

      {/* Content Preview */}
      <div className="relative mb-4">
        <p className={`text-sm text-zinc-300 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {script.content}
        </p>
        
        {/* Toggle Expand */}
        {script.content.length > 150 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 mt-2 transition-colors focus:outline-none"
          >
            {expanded ? (
              <>
                Lebih Sedikit <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Selengkapnya <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Specific highlights for Hooks/CTA (if expanded) */}
      {expanded && (script.hook || script.cta) && (
        <div className="border-t border-zinc-800/80 pt-3.5 mt-3 space-y-2.5 text-xs">
          {script.hook && (
            <div>
              <span className="font-bold text-pink-400">Viral Hook:</span>
              <p className="text-zinc-400 italic mt-0.5 font-medium">"{script.hook}"</p>
            </div>
          )}
          {script.cta && (
            <div>
              <span className="font-bold text-purple-400">Closing CTA:</span>
              <p className="text-zinc-400 italic mt-0.5 font-medium">"{script.cta}"</p>
            </div>
          )}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="border-t border-zinc-800/80 pt-4 flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="text-xs text-zinc-500 font-medium">
          Estimasi: <span className="text-zinc-300 font-semibold">{script.duration_estimate || 30}s</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Action */}
          {audio?.status === 'generated' ? (
            <div className="flex items-center gap-1">
              <button 
                onClick={handleAudioPlayClick}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                  isCurrentAudioPlaying 
                    ? 'bg-pink-600/20 text-pink-400 border-pink-500/40 shadow-[0_0_12px_rgba(236,72,153,0.15)] animate-pulse'
                    : 'bg-purple-950/20 text-purple-400 border-purple-800/30 hover:bg-purple-900/30'
                }`}
                title={isCurrentAudioPlaying ? "Pause Audio" : "Play Audio"}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              {onGenerateAudio && (
                <button 
                  onClick={() => onGenerateAudio(script.id)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/80 hover:text-white hover:bg-purple-600 hover:border-purple-500 transition-all"
                  title="Generate Ulang Audio Ara"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : onGenerateAudio ? (
            <button 
              onClick={() => onGenerateAudio(script.id)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/20"
              title="Buat Audio Ara"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Buat Audio
            </button>
          ) : null}

          {/* Schedule Action */}
          {onSchedule && (audio?.status === 'generated' || script.status === 'ready') && (
            <button 
              onClick={() => onSchedule(script, audio?.id || null)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/30"
            >
              <Calendar className="w-3.5 h-3.5" />
              Jadwalkan
            </button>
          )}

          {/* Edit Action */}
          {onEdit && (
            <button 
              onClick={() => onEdit(script)}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/80 hover:text-white hover:bg-zinc-700 transition-all"
              title="Edit Script"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Action */}
          {onDelete && (
            <button 
              onClick={() => onDelete(script.id)}
              className="p-2 rounded-xl bg-zinc-800/40 text-zinc-500 border border-zinc-800 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/30 transition-all"
              title="Hapus Script"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
