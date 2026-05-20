'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Mic, Sparkles, Volume2, Download, Trash2,
  RefreshCw, CheckCircle2, Play, Pause,
  Sliders, Globe, Server, Check, ArrowRight, Clock
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAudio } from '@/context/AudioContext';
import { supabase } from '@/lib/supabase';



function AudioGeneratorContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  // Scripts and audios lists
  const [scripts, setScripts] = useState<any[]>([]);
  const [audios, setAudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected script ID for generation (from query param)
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  // TTS Settings per script ID
  const [settings, setSettings] = useState<{
    [key: string]: {
      voice: string;
      engine: string;
      speed: number;
    }
  }>({});

  // Generating status states
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [generating, setGenerating] = useState<{ [key: string]: boolean }>({});
  const [batchGenerating, setBatchGenerating] = useState(false);

  // Fetch scripts & audios
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: scrData } = await supabase.from('scripts').select('*').order('created_at', { ascending: false });
      const { data: audData } = await supabase.from('audios').select('*');
      
      setScripts(scrData || []);
      setAudios(audData || []);

      // Initialize settings for scripts
      const initSettings: any = {};
      (scrData || []).forEach((s: any) => {
        initSettings[s.id] = {
          voice: 'EXAVITQu4vr4xnSDxMaL', // Default ElevenLabs Bella (Free Plan)
          engine: 'elevenlabs',
          speed: 1.0
        };
      });
      setSettings(initSettings);
    } catch (e) {
      console.error(e);
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check if script ID is in query parameter
    const scriptParam = searchParams.get('script');
    if (scriptParam) {
      setSelectedScriptId(scriptParam);
      showToast('Naskah terpilih telah difokuskan!', 'info');
    }
  }, [searchParams]);

  const handleSettingChange = (scriptId: string, key: string, value: any) => {
    setSettings(prev => {
      const current = prev[scriptId] || { voice: 'EXAVITQu4vr4xnSDxMaL', engine: 'elevenlabs', speed: 1.0 };
      const updated = { ...current, [key]: value };
      return {
        ...prev,
        [scriptId]: updated
      };
    });
  };

  // Convert Puter TTS URL to Blob and Upload to Supabase Storage
  // Delete synthesized audio record from database
  const handleDeleteAudio = async (audioId: string, scriptId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus audio Ara untuk naskah ini?')) return;
    
    try {
      showToast('Menghapus audio...', 'info', 1500);
      
      const { error } = await supabase
        .from('audios')
        .delete()
        .eq('id', audioId);

      if (error) throw error;

      showToast('Audio Ara berhasil dihapus!', 'success');
      
      // Refresh list to instantly restore Hasilkan Vokal state
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal menghapus audio: ${err.message}`, 'error');
    }
  };

  // Generate TTS for single script
  const handleGenerateTTS = async (script: any) => {
    const scriptId = script.id;
    const scriptSet = settings[scriptId] || { voice: 'nova', engine: 'openai', speed: 1.0 };
    
    setGenerating(prev => ({ ...prev, [scriptId]: true }));
    setProgress(prev => ({ ...prev, [scriptId]: 20 }));
    showToast(`Membuat Audio TTS Ara untuk "${script.title}"...`, 'info', 2000);

    try {
      setProgress(prev => ({ ...prev, [scriptId]: 60 }));
      
      // Call the server-side API to generate and upload to Supabase Storage (CORS-free!)
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_id: scriptId,
          voice: scriptSet.voice,
          engine: scriptSet.engine,
          duration: script.duration_estimate || 30
        })
      });

      const dbRes = await res.json();
      if (!dbRes.success) {
        throw new Error(dbRes.message || 'Gagal membuat audio');
      }
      
      setProgress(prev => ({ ...prev, [scriptId]: 100 }));
      showToast(`Audio TTS Ara "${script.title}" berhasil disimpan!`, 'success');
      
      // Refresh list
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(`TTS Gagal: ${err.message || 'Terjadi kesalahan'}. Klik ulangi.`, 'error');
    } finally {
      setGenerating(prev => ({ ...prev, [scriptId]: false }));
      // Clear progress after short delay
      setTimeout(() => {
        setProgress(prev => {
          const cp = { ...prev };
          delete cp[scriptId];
          return cp;
        });
      }, 1000);
    }
  };

  // Generate All (Batch 3 scripts)
  const handleBatchGenerate = async () => {
    // Find up to 3 scripts with 'ready' or 'draft' status that don't have audio
    const eligibleScripts = scripts.filter(s => {
      const hasAudio = audios.some(a => a.script_id === s.id && a.status === 'generated');
      return !hasAudio && (s.status === 'ready' || s.status === 'draft');
    }).slice(0, 3);

    if (eligibleScripts.length === 0) {
      showToast('Tidak ada naskah baru yang siap dibuatkan audio.', 'warning');
      return;
    }

    setBatchGenerating(true);
    showToast(`Memulai batch generate ${eligibleScripts.length} audio sekaligus...`, 'info');

    try {
      for (const scr of eligibleScripts) {
        await handleGenerateTTS(scr);
      }
      showToast('Selesai memproses batch audio!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal memproses seluruh batch', 'error');
    } finally {
      setBatchGenerating(false);
    }
  };

  const handlePlayAudio = (scriptTitle: string, matchedAudio: any) => {
    if (matchedAudio && matchedAudio.file_url) {
      playTrack({
        id: matchedAudio.id,
        file_url: matchedAudio.file_url,
        title: scriptTitle,
        voice: matchedAudio.voice || 'nova',
        script_content: 'Generated Audio Track'
      });
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Mic className="w-8 h-8 text-pink-500" />
            Audio Generator TTS Ara
          </h2>
          <p className="text-zinc-400 text-sm mt-1.5 font-medium">
            Ubah naskah coding Ara jadi suara vokal ceria berkecepatan tinggi menggunakan ElevenLabs AI.
          </p>
        </div>

        {/* Batch Generate */}
        <button 
          onClick={handleBatchGenerate}
          disabled={batchGenerating || scripts.length === 0}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-pink-950/20 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-white" />
          Generate Semua Audio (Maks 3)
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-64 bg-zinc-900 rounded-3xl border border-zinc-800"></div>
          ))}
        </div>
      ) : scripts.length === 0 ? (
        <div className="glass-panel border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
            <Mic className="w-8 h-8" />
          </div>
          <h4 className="text-white font-extrabold text-base">Belum Ada Naskah Tersedia</h4>
          <p className="text-zinc-500 text-xs mt-1.5 max-w-sm font-semibold leading-relaxed">
            Buat naskah coding menarik di Script Generator terlebih dahulu sebelum melakukan voice over otomatis!
          </p>
          <a href="/scripts" className="mt-5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all">
            Ke Script Generator <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {scripts.map(script => {
            const scriptId = script.id;
            const matchedAudio = audios.find(a => a.script_id === scriptId && a.status === 'generated');
            const isGenerating = generating[scriptId] || false;
            const currentProgress = progress[scriptId] || 0;
            const scriptSet = settings[scriptId] || { voice: 'nova', engine: 'openai', speed: 1.0 };
            
            const isCurrentPlaying = matchedAudio && currentTrack?.id === matchedAudio.id && isPlaying;
            const isFocused = selectedScriptId === scriptId;

            return (
              <div 
                key={scriptId}
                className={`glass-panel rounded-3xl p-6 border transition-all ${
                  isFocused 
                    ? 'border-purple-500 bg-purple-950/5 shadow-[0_0_20px_rgba(124,58,237,0.1)]' 
                    : 'border-zinc-800 hover:border-zinc-700/80'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Script details & text (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                          {script.category || 'coding'}
                        </span>
                        <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Slot {script.slot === 1 ? 'Pagi' : script.slot === 2 ? 'Siang' : 'Malam'}
                        </span>
                        {matchedAudio && (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Audio Terbuat
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mt-3">{script.title}</h3>
                      <p className="text-xs text-zinc-400 mt-2 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/40 leading-relaxed max-h-[120px] overflow-y-auto">
                        {script.content}
                      </p>
                    </div>

                    {/* Progress Bar (Visible only when generating) */}
                    {isGenerating && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-zinc-400">
                          <span>Mengubah naskah ke vokal Ara...</span>
                          <span>{currentProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${currentProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Settings & Generator Button (5 cols) */}
                  <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-pink-500" />
                      Konfigurasi TTS
                    </h4>

                    <div className="space-y-3.5">
                      {/* Voice Selection */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5" /> Voice Character
                        </span>
                        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex-wrap gap-1">
                          {[
                            { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (Free Plan)' },
                            { id: 'WQ4h6sgS9p2XXvLsESBT', label: 'Bella (Paid Plan)' }
                          ].map(v => (
                            <button
                              key={v.id}
                              onClick={() => handleSettingChange(scriptId, 'voice', v.id)}
                              disabled={isGenerating}
                              className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
                                scriptSet.voice === v.id
                                  ? 'bg-purple-650 text-white shadow-sm border border-purple-550'
                                  : 'text-zinc-500 hover:text-white border border-transparent'
                              }`}
                              title={v.id === 'WQ4h6sgS9p2XXvLsESBT' ? 'ElevenLabs Shared Library Voice (Paid subscription required)' : 'Default Pre-made Voice (Works on Free Plan)'}
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Engine Selection */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                          <Server className="w-3.5 h-3.5" /> Engine
                        </span>
                        <span className="bg-purple-950/40 border border-purple-800/40 rounded-xl px-3 py-1 text-[10px] uppercase font-extrabold text-purple-400">
                          ElevenLabs
                        </span>
                      </div>

                      {/* Speed Slider */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-zinc-500 mb-1.5">
                          <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Kecepatan Vokal</span>
                          <span className="text-purple-400 font-extrabold">{scriptSet.speed}x</span>
                        </div>
                        <input 
                          type="range"
                          min={0.8}
                          max={1.3}
                          step={0.1}
                          value={scriptSet.speed}
                          onChange={(e) => handleSettingChange(scriptId, 'speed', parseFloat(e.target.value))}
                          disabled={isGenerating}
                          className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Generate Button / Play Player */}
                    <div className="border-t border-zinc-800/60 pt-4 flex gap-2">
                      {matchedAudio ? (
                        <>
                          <button
                            onClick={() => handlePlayAudio(script.title, matchedAudio)}
                            className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-extrabold transition-all ${
                              isCurrentPlaying
                                ? 'bg-pink-600/20 text-pink-400 border-pink-500/40 animate-pulse'
                                : 'bg-purple-950/20 text-purple-400 border-purple-800/40 hover:bg-purple-900/30'
                            }`}
                          >
                            <Volume2 className="w-4 h-4" />
                            {isCurrentPlaying ? 'Pause Suara Ara' : 'Putar Suara Ara'}
                          </button>
                          
                          <button
                            onClick={() => handleGenerateTTS(script)}
                            disabled={isGenerating || batchGenerating}
                            className="p-3 bg-zinc-950 text-purple-400 hover:text-white border border-zinc-800 rounded-xl flex items-center justify-center transition-all"
                            title="Generate Ulang Vokal Ara"
                          >
                            <Sparkles className="w-4 h-4 animate-pulse" />
                          </button>
                          
                          <a
                            href={matchedAudio.file_url}
                            download={matchedAudio.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl flex items-center justify-center transition-all"
                            title="Download MP3"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => handleDeleteAudio(matchedAudio.id, scriptId)}
                            className="p-3 bg-zinc-950/40 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 border border-zinc-800 hover:border-rose-900/30 rounded-xl flex items-center justify-center transition-all"
                            title="Hapus Audio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleGenerateTTS(script)}
                          disabled={isGenerating || batchGenerating}
                          className="w-full py-3.5 rounded-xl btn-gradient text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-pink-950/20"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Mengolah Vokal...
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4 text-white" />
                              Hasilkan Vokal Ara
                            </>
                          )}
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default function AudioGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="glass-panel border-zinc-900 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 animate-spin">
          <RefreshCw className="w-5 h-5 text-purple-400" />
        </div>
        <h4 className="text-zinc-400 font-bold text-sm">Memuat Audio Generator...</h4>
      </div>
    }>
      <AudioGeneratorContent />
    </Suspense>
  );
}
