'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Calendar as CalendarIcon, Sparkles, Plus, 
  ChevronLeft, ChevronRight, Check, Clock, 
  X, HelpCircle, Film, Globe, MessageSquare,
  Volume2, RefreshCw
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAudio } from '@/context/AudioContext';
import { supabase } from '@/lib/supabase';
import PlatformIcon from '@/components/PlatformIcon';
import StatusBadge from '@/components/StatusBadge';

function ContentCalendarContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  // Calendar entries states
  const [calendarEntries, setCalendarEntries] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [audios, setAudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar display states
  const [currentDate, setCurrentDate] = useState(new Date()); // Represents currently viewed month
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  ); // Date currently selected for details
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');

  // Form scheduling modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleScriptId, setScheduleScriptId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('07:00');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);
  const [saving, setSaving] = useState(false);
  const [autoScheduling, setAutoScheduling] = useState(false);

  // Fetch all data
  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const { data: cal } = await supabase.from('content_calendar').select('*');
      const { data: scr } = await supabase.from('scripts').select('*');
      const { data: aud } = await supabase.from('audios').select('*');
      
      setCalendarEntries(cal || []);
      setScripts(scr || []);
      setAudios(aud || []);
    } catch (e) {
      console.error(e);
      showToast('Gagal memuat kalender konten', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();

    // Check if query params pre-select a script for scheduling
    const scriptParam = searchParams.get('script');
    if (scriptParam) {
      setScheduleScriptId(scriptParam);
      setIsModalOpen(true);
      showToast('Naskah terpilih dimasukkan ke penjadwal!', 'info');
    }
  }, [searchParams]);

  // Navigate calendar month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Auto schedule 7 days
  const handleAutoScheduleWeek = async () => {
    setAutoScheduling(true);
    showToast('Sedang menyusun jadwal otomatis 7 hari...', 'info');

    try {
      const res = await fetch('/api/auto-schedule-week', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        showToast(data.message || 'Jadwal otomatis berhasil dibuat!', 'success');
        fetchCalendarData();
      } else {
        showToast(data.message || 'Tidak ada naskah berstatus "ready" di database.', 'warning');
      }
    } catch (e) {
      console.error(e);
      showToast('Koneksi terputus saat automasi', 'error');
    } finally {
      setAutoScheduling(false);
    }
  };

  // Toggle platform select in form
  const handlePlatformToggle = (plat: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(plat) 
        ? prev.filter(p => p !== plat) 
        : [...prev, plat]
    );
  };

  // Create manual schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleScriptId) {
      showToast('Silakan pilih naskah', 'warning');
      return;
    }
    if (selectedPlatforms.length === 0) {
      showToast('Pilih minimal 1 platform', 'warning');
      return;
    }

    setSaving(true);
    // Find audio associated with the script
    const matchedAudio = audios.find(a => a.script_id === scheduleScriptId && a.status === 'generated');

    try {
      const res = await fetch('/api/schedule-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_id: matchedAudio?.id || null,
          script_id: scheduleScriptId,
          date: scheduleDate,
          time: scheduleTime + ':00',
          platforms: selectedPlatforms
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Naskah berhasil dijadwalkan!', 'success');
        setIsModalOpen(false);
        setScheduleScriptId('');
        fetchCalendarData();
      } else {
        showToast(data.message || 'Gagal menjadwalkan konten', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi terputus', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePlayAudio = (entry: any) => {
    const matchedAudio = audios.find(a => a.id === entry.audio_id || a.script_id === entry.script_id);
    const matchedScript = scripts.find(s => s.id === entry.script_id);
    
    if (matchedAudio && matchedAudio.file_url) {
      playTrack({
        id: matchedAudio.id,
        file_url: matchedAudio.file_url,
        title: matchedScript?.title || 'Video Track',
        voice: matchedAudio.voice || 'nova',
        script_content: matchedScript?.content || ''
      });
    } else {
      showToast('Audio belum digenerate untuk script ini.', 'warning');
    }
  };

  // Calendar math calculations
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return days;
  };

  const getFirstDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday, etc.
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const renderMonthDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const cells = [];

    // Empty spaces for previous month offset
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="bg-zinc-950/20 border border-zinc-900/40 p-2 min-h-[90px] md:min-h-[110px] opacity-25"></div>);
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = dayNum.toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Find entries for this day
      const dayEntries = calendarEntries.filter(c => c.scheduled_date === dateStr);
      const isSelected = selectedDateStr === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      cells.push(
        <div 
          key={`day-${dayNum}`}
          onClick={() => setSelectedDateStr(dateStr)}
          className={`border border-zinc-900 p-2 min-h-[90px] md:min-h-[110px] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            isSelected 
              ? 'bg-purple-950/25 border-purple-500 shadow-[0_0_15px_rgba(124,58,237,0.1)_inset]' 
              : isToday 
                ? 'bg-pink-950/15 border-pink-500/60' 
                : 'bg-zinc-900/30 hover:bg-zinc-900/60'
          }`}
        >
          {/* Day Num */}
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold ${
              isToday 
                ? 'bg-pink-600 text-white w-5.5 h-5.5 rounded-full flex items-center justify-center' 
                : isSelected 
                  ? 'text-purple-400 font-extrabold' 
                  : 'text-zinc-400'
            }`}>
              {dayNum}
            </span>
            
            {/* Indicators count */}
            {dayEntries.length > 0 && (
              <span className="text-[9px] font-extrabold bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                {dayEntries.length} Post
              </span>
            )}
          </div>

          {/* List thumbnails platform tags */}
          <div className="flex flex-col gap-1 mt-2.5">
            {dayEntries.slice(0, 2).map(entry => {
              const matchedScript = scripts.find(s => s.id === entry.script_id);
              const plats = entry.platform.split(',');
              
              return (
                <div key={entry.id} className="text-[10px] font-bold bg-zinc-950/60 border border-zinc-800/60 rounded px-1.5 py-0.5 text-zinc-300 truncate flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {plats.map((p: string) => (
                      <span key={p} className={`w-1.5 h-1.5 rounded-full ${
                        p === 'tiktok' ? 'bg-cyan-400' :
                        p === 'instagram' ? 'bg-pink-500' :
                        'bg-rose-500'
                      }`}></span>
                    ))}
                  </div>
                  <span className="truncate">{matchedScript?.title || 'Video'}</span>
                </div>
              );
            })}
            
            {dayEntries.length > 2 && (
              <span className="text-[8px] font-bold text-zinc-500 text-right">
                +{dayEntries.length - 2} lagi
              </span>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  // Day entries details
  const selectedDayEntries = calendarEntries.filter(c => c.scheduled_date === selectedDateStr);

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-purple-500" />
            Jadwal Konten Ara
          </h2>
          <p className="text-zinc-400 text-sm mt-1.5 font-medium">
            Atur dan jadwalkan tanggal terbit naskah video coding Ara ke TikTok, Instagram Reels, dan YouTube Shorts.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleAutoScheduleWeek}
            disabled={autoScheduling}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-purple-500/30 text-zinc-300 hover:text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            {autoScheduling ? 'Menjadwalkan...' : 'Auto-Schedule Minggu Ini'}
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-950/20"
          >
            <Plus className="w-4 h-4" />
            Jadwalkan Konten
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Calendar Monthly view (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-zinc-900/40 p-4 border border-zinc-900 rounded-2xl">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850 transition-all"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              
              <h3 className="text-base font-extrabold text-white min-w-[120px] text-center uppercase tracking-wider">
                {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h3>

              <button 
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850 transition-all"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
              {['month', 'week', 'day'].map((v: any) => (
                <button
                  key={v}
                  onClick={() => setViewType(v)}
                  className={`px-3.5 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    viewType === v
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {v === 'month' ? 'Bulan' : v === 'week' ? 'Minggu' : 'Hari'}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly grid */}
          <div className="glass-panel border-zinc-900 rounded-3xl overflow-hidden p-4">
            
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(dh => (
                <div key={dh} className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 py-1">{dh}</div>
              ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-1">
              {renderMonthDays()}
            </div>

          </div>
        </div>

        {/* Selected date drawer details (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-pink-500 animate-pulse" />
              Detail Hari Terpilih
            </h3>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-3 py-1 border border-zinc-850 rounded-xl">
              {new Date(selectedDateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="space-y-4">
            {selectedDayEntries.length === 0 ? (
              <div className="glass-panel border-zinc-850 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                <HelpCircle className="w-10 h-10 text-zinc-600 mb-3" />
                <h4 className="text-zinc-400 font-bold text-sm">Tidak Ada Jadwal Konten</h4>
                <p className="text-zinc-500 text-xs mt-1 max-w-[200px] leading-relaxed mx-auto font-semibold">
                  Klik "Jadwalkan Konten" di atas untuk mengisi slot posting hari ini!
                </p>
              </div>
            ) : (
              selectedDayEntries.map(entry => {
                const matchedScript = scripts.find(s => s.id === entry.script_id);
                const matchedAudio = audios.find(a => a.id === entry.audio_id || a.script_id === entry.script_id);
                const platforms = entry.platform.split(',');
                const isCurrentPlaying = matchedAudio && currentTrack?.id === matchedAudio.id && isPlaying;

                return (
                  <div key={entry.id} className="glass-panel rounded-2xl p-5 border border-zinc-850 space-y-4 animate-scale-in">
                    
                    {/* Time & status */}
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        Pukul: {entry.scheduled_time.substring(0, 5)}
                      </span>
                      <StatusBadge status={entry.status} type="calendar" />
                    </div>

                    {/* Script info */}
                    <div>
                      <h4 className="text-sm font-extrabold text-white leading-snug">{matchedScript?.title}</h4>
                      <p className="text-zinc-400 text-xs mt-1.5 bg-zinc-950/40 p-3.5 border border-zinc-900 rounded-xl max-h-[80px] overflow-y-auto font-semibold leading-relaxed">
                        {matchedScript?.content}
                      </p>
                    </div>

                    {/* Caption & Hashtag Details */}
                    <div className="space-y-1 bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
                      <p className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-pink-500" /> Caption & Hashtag
                      </p>
                      <p className="text-[10px] text-zinc-500 italic mt-0.5 line-clamp-2">
                        {entry.caption}
                      </p>
                    </div>

                    {/* Platforms & Play Audio */}
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-1">
                        {platforms.map((plat: string) => (
                          <PlatformIcon key={plat} platform={plat} size="sm" showLabel={false} />
                        ))}
                      </div>

                      {matchedAudio ? (
                        <button 
                          onClick={() => handlePlayAudio(entry)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                            isCurrentPlaying
                              ? 'bg-pink-600/20 text-pink-400 border-pink-500/40'
                              : 'bg-purple-950/20 text-purple-400 border-purple-800/30 hover:bg-purple-900/30'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          {isCurrentPlaying ? 'Stop' : 'Putar Audio'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-bold">Tanpa Audio</span>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* manual Scheduling form modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0"
          ></div>

          <div className="glass-panel-glow border-purple-500/30 w-full max-w-md rounded-3xl p-6 relative z-10 animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-5">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
                Jadwal Posting Manual
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              
              {/* Select Script */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Pilih Naskah Coding Ara</label>
                <select
                  required
                  value={scheduleScriptId}
                  onChange={(e) => setScheduleScriptId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="" className="bg-zinc-950 font-semibold text-zinc-500">-- Pilih Naskah --</option>
                  
                  {scripts
                    .filter(s => s.status === 'ready' || s.status === 'draft')
                    .map(s => {
                      const audio = audios.find(a => a.script_id === s.id && a.status === 'generated');
                      return (
                        <option 
                          key={s.id} 
                          value={s.id} 
                          className="bg-zinc-950 font-semibold text-white"
                        >
                          [{s.category?.toUpperCase() || 'CODING'}] {s.title} {audio ? '(🎙️ Audio Ok)' : '(Tanpa Audio)'}
                        </option>
                      );
                    })}
                </select>
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">Hanya naskah terbuat yang didaftarkan di atas.</p>
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Tanggal Posting</label>
                <input 
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              {/* Time Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Waktu Posting</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Pagi (07.00)', val: '07:00' },
                    { label: 'Siang (12.00)', val: '12:00' },
                    { label: 'Malam (19.00)', val: '19:00' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setScheduleTime(item.val)}
                      className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${
                        scheduleTime === item.val
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Checkbox */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Pilih Platform Distribusi</label>
                <div className="flex gap-2">
                  {['tiktok', 'instagram', 'youtube'].map(plat => {
                    const isSel = selectedPlatforms.includes(plat);
                    
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => handlePlatformToggle(plat)}
                        className={`flex-1 py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                          isSel
                            ? plat === 'tiktok' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/60' :
                              plat === 'instagram' ? 'bg-pink-950/40 text-pink-400 border-pink-800/60' :
                              'bg-rose-950/40 text-rose-400 border-rose-800/60'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <PlatformIcon platform={plat} size="sm" />
                        <span className="capitalize">{plat === 'youtube' ? 'Shorts' : plat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl btn-gradient text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all mt-4"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan Jadwal...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Konfirmasi & Daftarkan
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ContentCalendarPage() {
  return (
    <Suspense fallback={
      <div className="glass-panel border-zinc-900 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 animate-spin">
          <RefreshCw className="w-5 h-5 text-purple-400" />
        </div>
        <h4 className="text-zinc-400 font-bold text-sm">Memuat Kalender Konten...</h4>
      </div>
    }>
      <ContentCalendarContent />
    </Suspense>
  );
}
