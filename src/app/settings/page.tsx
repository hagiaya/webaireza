'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Key, Bell, 
  Download, Database, Save, Check, 
  Eye, EyeOff, Sparkles, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function SettingsPage() {
  const { showToast } = useToast();

  // Profile states
  const [charName, setCharName] = useState('Ara');
  const [tagline, setTagline] = useState('AI Coding Influencer Indonesia');
  const [defaultVoice, setDefaultVoice] = useState('nova');
  const [pagiSlot, setPagiSlot] = useState(true);
  const [siangSlot, setSiangSlot] = useState(true);
  const [malamSlot, setMalamSlot] = useState(true);

  // API Key states
  const [anthropicKey, setAnthropicKey] = useState('');
  const [elevenKey, setElevenKey] = useState('');
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showEleven, setShowEleven] = useState(false);

  // Preference states
  const [notifSuccess, setNotifSuccess] = useState(true);
  const [autoSaveLocal, setAutoSaveLocal] = useState(true);

  const [saving, setSaving] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCharName(localStorage.getItem('ara_settings_charName') || 'Ara');
      setTagline(localStorage.getItem('ara_settings_tagline') || 'AI Coding Influencer Indonesia');
      setDefaultVoice(localStorage.getItem('ara_settings_defaultVoice') || 'nova');
      setAnthropicKey(localStorage.getItem('ara_settings_anthropicKey') || '');
      setElevenKey(localStorage.getItem('ara_settings_elevenKey') || '');
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ara_settings_charName', charName);
        localStorage.setItem('ara_settings_tagline', tagline);
        localStorage.setItem('ara_settings_defaultVoice', defaultVoice);
        localStorage.setItem('ara_settings_anthropicKey', anthropicKey);
        localStorage.setItem('ara_settings_elevenKey', elevenKey);
      }
      
      showToast('Pengaturan Ara Studio berhasil disimpan!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    showToast('Mengekspor seluruh database...', 'success');
    
    // Simulate export JSON
    const data = {
      profile: { charName, tagline, defaultVoice },
      exportDate: new Date().toISOString(),
      app: 'Ara Studio AI Influencer Automation'
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ara_studio_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearDatabase = () => {
    if (!confirm('PENTING: Apakah kamu yakin ingin menghapus seluruh data local Ara? Tindakan ini akan mereset topik, script, dan kalender!')) return;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ara_topics');
      localStorage.removeItem('ara_scripts');
      localStorage.removeItem('ara_audios');
      localStorage.removeItem('ara_content_calendar');
      localStorage.removeItem('ara_analytics');
    }
    showToast('Trial Database lokal berhasil di-reset!', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-zinc-900 pb-6">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
          <Settings className="w-8 h-8 text-purple-500" />
          Pengaturan Ara Studio
        </h2>
        <p className="text-zinc-400 text-sm mt-1.5 font-medium">
          Konfigurasi profile influencer Ara, masukan API key AI kamu, dan kelola backup database.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Profile & Voice Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Profile Card */}
          <div className="glass-panel border-zinc-900 rounded-3xl p-6 space-y-5">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
              <User className="w-5 h-5 text-purple-400" />
              Profil AI Influencer "Ara"
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Nama Karakter</label>
                <input 
                  type="text"
                  required
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-semibold"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Tagline Profil</label>
                <input 
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-semibold"
                />
              </div>
            </div>

            {/* Default Voice Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Default Voice TTS (ElevenLabs / OpenAI)</label>
              <select
                value={defaultVoice}
                onChange={(e) => setDefaultVoice(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-semibold"
              >
                <option value="nova">Nova (Ceria & Lembut - Rekomendasi)</option>
                <option value="shimmer">Shimmer (Profesional & Dinamis)</option>
                <option value="coral">Coral (Ramah & Menenangkan)</option>
                <option value="alloy">Alloy (Natural & Tegas)</option>
              </select>
            </div>

            {/* default schedule slots */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Default Schedule Posting</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPagiSlot(!pagiSlot)}
                  className={`py-3 px-4 border rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    pagiSlot
                      ? 'bg-purple-950/40 text-purple-400 border-purple-800/60 shadow-sm shadow-purple-950/20'
                      : 'bg-zinc-900/40 text-zinc-500 border-zinc-800'
                  }`}
                >
                  <Check className={`w-4 h-4 ${pagiSlot ? 'opacity-100' : 'opacity-0'}`} />
                  Slot Pagi (07.00)
                </button>
                <button
                  type="button"
                  onClick={() => setSiangSlot(!siangSlot)}
                  className={`py-3 px-4 border rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    siangSlot
                      ? 'bg-pink-950/40 text-pink-400 border-pink-800/60 shadow-sm shadow-pink-950/20'
                      : 'bg-zinc-900/40 text-zinc-500 border-zinc-800'
                  }`}
                >
                  <Check className={`w-4 h-4 ${siangSlot ? 'opacity-100' : 'opacity-0'}`} />
                  Slot Siang (12.00)
                </button>
                <button
                  type="button"
                  onClick={() => setMalamSlot(!malamSlot)}
                  className={`py-3 px-4 border rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    malamSlot
                      ? 'bg-purple-950/40 text-purple-400 border-purple-800/60 shadow-sm shadow-purple-950/20'
                      : 'bg-zinc-900/40 text-zinc-500 border-zinc-800'
                  }`}
                >
                  <Check className={`w-4 h-4 ${malamSlot ? 'opacity-100' : 'opacity-0'}`} />
                  Slot Malam (19.00)
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Settings */}
          <div className="glass-panel border-zinc-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Bell className="w-5 h-5 text-purple-400" />
              Preferensi Aplikasi
            </h3>

            <div className="space-y-3.5">
              <label className="flex items-center gap-3.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={notifSuccess}
                  onChange={(e) => setNotifSuccess(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-850 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-zinc-300">Aktifkan notifikasi toast instan saat aksi selesai</span>
              </label>

              <label className="flex items-center gap-3.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={autoSaveLocal}
                  onChange={(e) => setAutoSaveLocal(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-850 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-zinc-300">Simpan perubahan profile secara lokal (Auto-save)</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl btn-gradient text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-950/20"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Menyimpan Perubahan...
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                Simpan Pengaturan
              </>
            )}
          </button>

        </div>

        {/* Column 2: Keys & Database Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* API Keys Card */}
          <div className="glass-panel border-zinc-900 rounded-3xl p-6 space-y-5">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Key className="w-5 h-5 text-pink-400" />
              Konfigurasi API Keys AI
            </h3>

            {/* Anthropic Claude API */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Anthropic Claude API Key</label>
              <div className="relative">
                <input 
                  type={showAnthropic ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-2xl pl-4 pr-11 py-3 text-sm text-white focus:outline-none transition-all placeholder-zinc-650 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropic(!showAnthropic)}
                  className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showAnthropic ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">Digunakan untuk menjangkau Claude 3 Haiku guna generate naskah video coding.</p>
            </div>

            {/* ElevenLabs API */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">ElevenLabs API Key (Opsional)</label>
              <div className="relative">
                <input 
                  type={showEleven ? 'text' : 'password'}
                  value={elevenKey}
                  onChange={(e) => setElevenKey(e.target.value)}
                  placeholder="Key ElevenLabs kamu..."
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-2xl pl-4 pr-11 py-3 text-sm text-white focus:outline-none transition-all placeholder-zinc-650 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowEleven(!showEleven)}
                  className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showEleven ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">Opsional jika kamu ingin memakai engine ElevenLabs untuk voice synthesis.</p>
            </div>
          </div>

          {/* Database & Export Actions */}
          <div className="glass-panel border-zinc-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Database className="w-5 h-5 text-purple-400" />
              Kelola Database lokal
            </h3>

            <div className="space-y-3">
              {/* Export backup */}
              <button
                type="button"
                onClick={handleExportData}
                className="w-full py-3 px-4 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4 text-purple-400" />
                Ekspor Backup Database (.json)
              </button>

              {/* Reset database */}
              <button
                type="button"
                onClick={handleClearDatabase}
                className="w-full py-3 px-4 bg-rose-950/20 border border-rose-900/30 hover:border-rose-500 text-rose-400 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4 text-rose-400" />
                Reset Database Uji Coba
              </button>
            </div>
          </div>

          {/* Autopilot 24h Cron Panel */}
          <AutopilotControlCard />

        </div>

      </form>
    </div>
  );
}

function AutopilotControlCard() {
  const { showToast } = useToast();
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');

  const triggerAutopilot = async () => {
    setRunning(true);
    setLogs(['🚀 Memulai Ara Autopilot Pipeline...', '📡 Menghubungkan ke API /api/cron/auto-generator...']);
    showToast('Menjalankan sistem autopilot 24 jam Ara...', 'info');

    try {
      const res = await fetch('/api/cron/auto-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        setTargetDate(data.target_date);
        setLogs(prev => [
          ...prev,
          `📅 Tanggal Target Terjadwal: ${data.target_date}`,
          ...data.logs,
          '🎉 Seluruh 3 konten bertema Developer & Bisnis sukses dijadwalkan!'
        ]);
        showToast('Autopilot sukses menjadwalkan 3 video hari ini!', 'success');
      } else {
        throw new Error(data.error || 'Gagal menjalankan autopilot');
      }
    } catch (e: any) {
      console.error(e);
      setLogs(prev => [...prev, `❌ Error: ${e.message}`]);
      showToast(`Gagal: ${e.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="glass-panel border-zinc-900 rounded-3xl p-6 space-y-4">
      <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
        Sistem Autopilot 24 Jam Ara
      </h3>

      <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
        Mengotomatiskan produksi konten AI Ara 24 jam nonstop untuk merender dan menjadwalkan <span className="text-purple-400 font-bold">3 Video / Hari</span> dengan spesifikasi tema industri:
      </p>

      <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-900 text-xs space-y-2.5 font-semibold text-zinc-300">
        <div className="flex gap-2 items-start">
          <span className="text-purple-400 font-bold">🌅 Slot 07:00 Pagi:</span>
          <span>Developer Content Creator (Tips coding, lifestyle IT, branding).</span>
        </div>
        <div className="flex gap-2 items-start border-t border-zinc-900/60 pt-2">
          <span className="text-pink-400 font-bold">☀️ Slot 12:00 Siang:</span>
          <span>Jasa Website Perusahaan (Landing page premium, corporate profiles).</span>
        </div>
        <div className="flex gap-2 items-start border-t border-zinc-900/60 pt-2">
          <span className="text-cyan-400 font-bold">🌙 Slot 19:00 Malam:</span>
          <span>Jasa App Enterprise (ERP kustom, CRM, integrasi database corporate).</span>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-2xl text-[10px] text-zinc-550 font-mono flex flex-col gap-1">
        <span className="font-bold text-zinc-450 uppercase">Webhook Cron 24 Jam:</span>
        <span className="text-zinc-350 break-all select-all">POST /api/cron/auto-generator</span>
        <span className="mt-1">💡 Hubungkan URL di atas ke Vercel Cron atau cron-job.org untuk eksekusi otomatis tiap jam 00:00!</span>
      </div>

      {logs.length > 0 && (
        <div className="bg-black border border-zinc-900 rounded-2xl p-3.5 font-mono text-[9px] text-zinc-400 space-y-1 max-h-36 overflow-y-auto">
          {logs.map((log, i) => (
            <p key={i} className={log.startsWith('✅') ? 'text-emerald-400 font-bold' : log.startsWith('❌') ? 'text-rose-400' : 'text-zinc-350'}>
              {log}
            </p>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={running}
        onClick={triggerAutopilot}
        className="w-full py-3 px-4 btn-gradient hover:opacity-90 disabled:opacity-50 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2"
      >
        {running ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Menjalankan Autopilot Pipeline...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 text-white" />
            Picu Autopilot Sekarang (3 Konten)
          </>
        )}
      </button>
    </div>
  );
}
