'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Mic, Calendar, CheckSquare, 
  Sparkles, Play, Plus, ArrowRight, 
  Activity, Volume2, Globe, Clock, Check, Film
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAudio } from '@/context/AudioContext';
import StatusBadge from '@/components/StatusBadge';
import PlatformIcon from '@/components/PlatformIcon';

interface DashboardStats {
  scriptsToday: number;
  audiosGenerated: number;
  scheduledThisWeek: number;
  contentPosted: number;
}

interface ContentSlot {
  slot: number;
  time: string;
  name: string;
  status: string;
  title: string;
  audio_url: string | null;
  audio_id: string | null;
  script_id: string | null;
  platforms: string[];
}

interface ActivityLog {
  id: string;
  type: 'script' | 'audio' | 'calendar';
  message: string;
  time: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    scriptsToday: 0,
    audiosGenerated: 0,
    scheduledThisWeek: 0,
    contentPosted: 0,
  });
  const [slots, setSlots] = useState<ContentSlot[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [batchGenerating, setBatchGenerating] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/dashboard-stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
        setSlots(json.slots);
        setActivities(json.activityLog);
      } else {
        showToast('Gagal memuat data dashboard', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Koneksi internet bermasalah', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Silent Autopilot Automation: Check and run pipeline automatically if not run today
    const runSilentAutopilot = async () => {
      try {
        const lastRun = localStorage.getItem('ara_autopilot_last_run');
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (lastRun !== todayStr) {
          console.log('🤖 Autopilot Ara: Memeriksa dan mengotomatiskan 3 konten hari ini...');
          const res = await fetch('/api/cron/auto-generator', { method: 'POST' });
          const data = await res.json();
          if (data.success && data.summary && data.summary.length > 0) {
            localStorage.setItem('ara_autopilot_last_run', todayStr);
            console.log('🤖 Autopilot Ara sukses menjadwalkan 3 video baru:', data.summary);
            showToast('Sistem Autopilot Ara: 3 video otomatis hari ini berhasil dibuat!', 'success');
            // Reload stats to show newly scheduled items
            fetchDashboardData(true);
          } else {
            // Already scheduled or no action needed
            localStorage.setItem('ara_autopilot_last_run', todayStr);
          }
        }
      } catch (e) {
        console.error('Gagal menjalankan silent autopilot:', e);
      }
    };

    // Delay run by 2 seconds to not block primary dashboard paint
    const timer = setTimeout(runSilentAutopilot, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateAllAudio = async () => {
    setBatchGenerating(true);
    showToast('Memulai pembuatan batch audio TTS Ara...', 'info', 2000);
    
    try {
      // Find slots that are in 'ready_to_schedule' but have no audio, or we can hit auto-generate audio API
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: true })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(`Berhasil men-generate ${data.count} audio TTS baru!`, 'success');
        fetchDashboardData(true);
      } else {
        showToast(data.message || 'Gagal membuat audio TTS', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi terputus saat membuat audio', 'error');
    } finally {
      setBatchGenerating(false);
    }
  };

  const handlePlayAudio = (slot: ContentSlot) => {
    if (slot.audio_url && slot.audio_id) {
      playTrack({
        id: slot.audio_id,
        file_url: slot.audio_url,
        title: slot.title,
        voice: 'nova',
        script_content: 'Today\'s Scheduled Video'
      });
    }
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-14 bg-zinc-900 rounded-2xl w-1/3"></div>
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-zinc-900 rounded-3xl border border-zinc-800"></div>
          ))}
        </div>
        {/* Contents Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-zinc-900 rounded-3xl border border-zinc-800"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 1. Header with Ara Avatar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-purple-500 shadow-xl overflow-hidden bg-zinc-900 relative group flex-shrink-0">
            <img 
              src="/avatar_park.jpg" 
              alt="Ara Avatar" 
              className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
            />
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950 animate-pulse"></span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Halo, Saya Ara! <span className="text-2xl animate-bounce">👋</span>
            </h2>
            <p className="text-zinc-400 text-sm mt-0.5 font-medium">
              Asisten AI Influencer Anda — Siap memproduksi konten edukasi coding premium Anda hari ini.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-purple-950/20 px-3.5 py-2 rounded-2xl border border-purple-900/40 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-bold text-purple-300">Alps Studio Autopilot Active</span>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1 */}
        <div className="glass-panel border-zinc-800 rounded-3xl p-6 card-hover-glow flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 group-hover:bg-purple-500/10 rounded-bl-3xl transition-colors"></div>
          <div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Script Hari Ini</span>
            <h3 className="text-3xl font-extrabold text-white mt-2">{stats.scriptsToday}</h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-1">Status: Draft/Ready</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-950/40 text-purple-400 border border-purple-800/30 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel border-zinc-800 rounded-3xl p-6 card-hover-glow flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 group-hover:bg-pink-500/10 rounded-bl-3xl transition-colors"></div>
          <div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Audio Generated</span>
            <h3 className="text-3xl font-extrabold text-white mt-2">{stats.audiosGenerated}</h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-1">Siap untuk diposting</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-950/40 text-pink-400 border border-pink-800/30 flex items-center justify-center">
            <Mic className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel border-zinc-800 rounded-3xl p-6 card-hover-glow flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 group-hover:bg-purple-500/10 rounded-bl-3xl transition-colors"></div>
          <div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Jadwal Minggu Ini</span>
            <h3 className="text-3xl font-extrabold text-white mt-2">{stats.scheduledThisWeek}</h3>
            <p className="text-[10px] text-zinc-400 font-semibold mt-1">Jadwal konten otomatis</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-950/40 text-purple-400 border border-purple-800/30 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-panel border-zinc-800 rounded-3xl p-6 card-hover-glow flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 group-hover:bg-emerald-500/10 rounded-bl-3xl transition-colors"></div>
          <div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Posted</span>
            <h3 className="text-3xl font-extrabold text-white mt-2">{stats.contentPosted}</h3>
            <p className="text-[10px] text-emerald-400 font-bold mt-1">Live di TikTok & Shorts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Aksi Cepat */}
      <div className="glass-panel-glow border-purple-500/10 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-pink-900/5 opacity-50 pointer-events-none"></div>
        <h4 className="text-sm font-extrabold uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2 relative z-10">
          <Activity className="w-4 h-4 text-pink-500" />
          Aksi Cepat
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
          <Link 
            href="/scripts?auto=true"
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/30 hover:bg-zinc-900 transition-all font-bold text-sm text-white group"
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4.5 h-4.5 text-purple-400" />
              Generate Script
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </Link>
          
          <button 
            onClick={handleGenerateAllAudio}
            disabled={batchGenerating}
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-pink-500/30 hover:bg-zinc-900 transition-all font-bold text-sm text-white group text-left"
          >
            <span className="flex items-center gap-2.5">
              <Mic className="w-4.5 h-4.5 text-pink-400" />
              {batchGenerating ? 'Generating...' : 'Generate Semua Audio'}
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
          </button>

          <Link 
            href="/video"
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-purple-500/30 hover:bg-zinc-900 transition-all font-bold text-sm text-white group"
          >
            <span className="flex items-center gap-2.5">
              <Film className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
              Render Video AI
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link 
            href="/calendar"
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-pink-500/30 hover:bg-zinc-900 transition-all font-bold text-sm text-white group"
          >
            <span className="flex items-center gap-2.5">
              <Calendar className="w-4.5 h-4.5 text-pink-400" />
              Jadwal Konten
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* 4. Grid Section: Konten Hari Ini & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Konten Hari Ini (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Konten Hari Ini (3 Slot Posting)
            </h3>
            <span className="text-xs font-semibold text-zinc-500">
              Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          <div className="space-y-4">
            {slots.map((slot) => {
              const isCurrentPlaying = slot.audio_id && currentTrack?.id === slot.audio_id && isPlaying;
              
              return (
                <div 
                  key={slot.slot} 
                  className={`glass-panel rounded-2xl p-5 border transition-all ${
                    slot.status === 'posted' ? 'border-emerald-500/20 bg-emerald-950/5' :
                    slot.status === 'scheduled' ? 'border-purple-500/20 bg-purple-950/5' :
                    'border-zinc-800'
                  } card-hover-glow flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
                >
                  <div className="flex items-start gap-4">
                    {/* Time Slot badge */}
                    <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="text-xs font-extrabold text-white">{slot.time}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">SLOT {slot.slot}</span>
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={slot.status} type="calendar" />
                        
                        {/* Display Platform Icons */}
                        {slot.platforms.length > 0 && (
                          <div className="flex gap-1">
                            {slot.platforms.map(plat => (
                              <PlatformIcon key={plat} platform={plat} size="sm" />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <h4 className="text-base font-extrabold text-white mt-2 truncate">
                        {slot.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions depending on slot status */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t border-zinc-900 md:border-none pt-3 md:pt-0">
                    {slot.audio_url ? (
                      <button 
                        onClick={() => handlePlayAudio(slot)}
                        className={`px-4 py-2 rounded-xl border flex items-center justify-center gap-2 text-xs font-extrabold transition-all ${
                          isCurrentPlaying
                            ? 'bg-pink-600/20 text-pink-400 border-pink-500/40 animate-pulse'
                            : 'bg-purple-950/20 text-purple-400 border-purple-800/40 hover:bg-purple-900/30'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                        {isCurrentPlaying ? 'Memutar...' : 'Putar Audio'}
                      </button>
                    ) : null}

                    {slot.status === 'empty' && (
                      <Link 
                        href={`/scripts?slot=${slot.slot}`}
                        className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Buat Script
                      </Link>
                    )}

                    {slot.status === 'script_draft' && slot.script_id && (
                      <Link 
                        href={`/scripts?id=${slot.script_id}`}
                        className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        Edit Draft
                      </Link>
                    )}

                    {slot.status === 'ready_to_schedule' && slot.script_id && (
                      <div className="flex gap-2">
                        {!slot.audio_url ? (
                          <Link 
                            href={`/audio?script=${slot.script_id}`}
                            className="px-3.5 py-2 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-pink-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Mic className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                            Buat Audio TTS
                          </Link>
                        ) : (
                          <Link 
                            href={`/video?script=${slot.script_id}`}
                            className="px-3.5 py-2 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Film className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                            Buat Video AI
                          </Link>
                        )}
                        <Link 
                          href={`/calendar?script=${slot.script_id}`}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/20"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Jadwalkan
                        </Link>
                      </div>
                    )}

                    {slot.status === 'scheduled' && (
                      <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Menunggu tayang
                      </span>
                    )}

                    {slot.status === 'posted' && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                        Telah Terbit
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Activity Log (1/3 width on desktop) */}
        <div className="space-y-6">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-pink-500" />
            Aktivitas Terbaru
          </h3>

          <div className="glass-panel border-zinc-800 rounded-3xl p-5 space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-zinc-500 font-semibold">Belum ada aktivitas terekam.</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.map((act, actIdx) => (
                    <li key={act.id}>
                      <div className="relative pb-8">
                        {actIdx !== activities.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-900" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center ${
                              act.type === 'script' ? 'bg-purple-950/40 border-purple-800/30 text-purple-400' :
                              act.type === 'audio' ? 'bg-pink-950/40 border-pink-800/30 text-pink-400' :
                              'bg-emerald-950/40 border-emerald-800/30 text-emerald-400'
                            }`}>
                              {act.type === 'script' && <FileText className="w-4.5 h-4.5" />}
                              {act.type === 'audio' && <Mic className="w-4.5 h-4.5" />}
                              {act.type === 'calendar' && <Calendar className="w-4.5 h-4.5" />}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                              {act.message}
                            </p>
                            <span className="text-[10px] text-zinc-500 font-bold block mt-1">
                              {timeAgo(act.time)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
