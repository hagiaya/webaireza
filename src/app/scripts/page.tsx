'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Sparkles, FileText, Calendar, Plus, 
  Trash2, Edit3, Check, RefreshCw, 
  FileCode, Play, Hourglass, CheckSquare, Clock, X
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAudio } from '@/context/AudioContext';
import { supabase, isMockDb } from '@/lib/supabase';
import ScriptCard from '@/components/ScriptCard';

function ScriptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  // Form states
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('javascript');
  const [slot, setSlot] = useState(1);
  const [duration, setDuration] = useState(30);

  // Script states
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scripts, setScripts] = useState<any[]>([]);
  const [audios, setAudios] = useState<any[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(true);

  // Active generated preview
  const [previewScript, setPreviewScript] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedHook, setEditedHook] = useState('');
  const [editedCta, setEditedCta] = useState('');

  // Filtering states
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const categories = [
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'react', label: 'React' },
    { value: 'python', label: 'Python' },
    { value: 'git', label: 'Git' },
    { value: 'database', label: 'Database' },
    { value: 'tips', label: 'Tips & Tricks' }
  ];

  // Fetch all scripts & audios
  const fetchScripts = async () => {
    setLoadingScripts(true);
    try {
      const { data: scrData } = await supabase.from('scripts').select('*').order('created_at', { ascending: false });
      const { data: audData } = await supabase.from('audios').select('*');
      setScripts(scrData || []);
      setAudios(audData || []);
    } catch (e) {
      console.error(e);
      showToast('Gagal memuat daftar naskah', 'error');
    } finally {
      setLoadingScripts(false);
    }
  };

  useEffect(() => {
    fetchScripts();

    // Check if query params indicate auto-filling from Aksi Cepat
    const autoGen = searchParams.get('auto');
    const slotParam = searchParams.get('slot');
    if (slotParam) {
      setSlot(parseInt(slotParam));
    }
    if (autoGen) {
      setTitle('Tutorial Flexbox Mantap');
      setTopic('Cara Centering Div CSS');
      setCategory('css');
      setDuration(30);
      showToast('Form terisi otomatis! Silakan klik "Generate Script"', 'info');
    }
  }, [searchParams]);

  // AI generator handler
  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      showToast('Topik/Keyword wajib diisi', 'warning');
      return;
    }

    setGenerating(true);
    setPreviewScript(null);
    setEditMode(false);
    showToast('Ara sedang merangkai kata... ✍️✨', 'info', 2000);

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          duration,
          slot,
          category
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (isMockDb) {
          await supabase.from('scripts').insert(data.script);
        }
        setPreviewScript(data.script);
        setEditedTitle(data.script.title);
        setEditedContent(data.script.content);
        setEditedHook(data.script.hook || '');
        setEditedCta(data.script.cta || '');
        showToast('Script AI Ara berhasil dibuat! Sila tinjau di panel preview.', 'success');
      } else {
        showToast(data.message || 'Gagal generate script', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Koneksi terputus saat generate', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Save/Update edited script
  const handleSaveScript = async () => {
    if (!previewScript) return;
    setSaving(true);

    try {
      const updatedFields = {
        title: editedTitle,
        content: editedContent,
        hook: editedHook,
        cta: editedCta,
        status: 'ready' // set to ready when saved/approved
      };

      const { error } = await supabase
        .from('scripts')
        .update(updatedFields)
        .eq('id', previewScript.id);

      if (error) {
        showToast('Gagal menyimpan naskah', 'error');
      } else {
        showToast('Naskah Ara berhasil disimpan dan siap dibuat audio!', 'success');
        setPreviewScript(null); // Clear preview
        fetchScripts(); // Refresh list
        // Reset form
        setTitle('');
        setTopic('');
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan saat menyimpan', 'error');
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  };

  // Delete script
  const handleDeleteScript = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus script ini?')) return;
    
    try {
      const { error } = await supabase.from('scripts').delete().eq('id', id);
      if (error) {
        showToast('Gagal menghapus script', 'error');
      } else {
        showToast('Script berhasil dihapus', 'success');
        fetchScripts();
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan', 'error');
    }
  };

  // Edit script in preview (for existing script cards)
  const handleEditExisting = (script: any) => {
    setPreviewScript(script);
    setEditedTitle(script.title);
    setEditedContent(script.content);
    setEditedHook(script.hook || '');
    setEditedCta(script.cta || '');
    setEditMode(true);
    // Scroll smoothly to top editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Naskah dimuat ke editor!', 'info');
  };

  // Filter scripts
  const filteredScripts = scripts.filter(s => {
    const matchCat = filterCategory === 'all' || s.category?.toLowerCase() === filterCategory.toLowerCase();
    const matchStatus = filterStatus === 'all' || s.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchCat && matchStatus;
  });

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Heading */}
      <div className="border-b border-zinc-900 pb-6">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
          <Sparkles className="w-8 h-8 text-purple-500" />
          Script Generator AI Ara
        </h2>
        <p className="text-zinc-400 text-sm mt-1.5 font-medium">
          Tulis ide atau keyword kamu, biar AI Ara yang menyusun naskah video edukasi coding gaul, lengkap dengan hook viral & CTA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Generator Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2 mb-5">
              <FileCode className="w-5 h-5 text-purple-400" />
              Rancang Topik Konten
            </h3>

            <form onSubmit={handleGenerateScript} className="space-y-5">
              {/* Judul (Opsional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Judul Konten (Ref/Draft)</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: CSS Flexbox Tutorial"
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder-zinc-600 font-semibold"
                />
              </div>

              {/* Topik / Keyword (Wajib) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Topik atau Keyword Utama</label>
                <input 
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Beda Flexbox vs Grid CSS"
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder-zinc-600 font-semibold"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Kategori Coding</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-semibold"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-zinc-950 text-white font-semibold">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Durasi */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Target Durasi Video</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuration(dur)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        duration === dur
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/20'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      {dur} Detik
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Posting */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Slot Posting Harian</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: 'Pagi (07.00)' },
                    { val: 2, label: 'Siang (12.00)' },
                    { val: 3, label: 'Malam (19.00)' }
                  ].map(slt => (
                    <button
                      key={slt.val}
                      type="button"
                      onClick={() => setSlot(slt.val)}
                      className={`py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                        slot === slt.val
                          ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-950/20'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      {slt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={generating}
                className="w-full py-3.5 rounded-2xl btn-gradient text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyusun Script Ara...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4.5 h-4.5" />
                    Generate Script dengan AI
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: Live Preview & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {previewScript ? (
            <div className="glass-panel-glow border-purple-500/30 rounded-3xl p-6 relative overflow-hidden animate-scale-in">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-400 animate-pulse" />
                  Naskah Preview & Editor
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-zinc-900 px-3 py-1 border border-zinc-800 rounded-lg text-zinc-400">
                    Estimasi: {previewScript.duration_estimate || 30}s
                  </span>
                  <button 
                    onClick={() => setPreviewScript(null)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                    title="Tutup Preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Editable Title */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Judul Video</label>
                  <input 
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    readOnly={!editMode}
                    className={`w-full bg-zinc-900/40 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-all ${
                      editMode ? 'border-purple-500 bg-zinc-900' : 'border-transparent cursor-default'
                    }`}
                  />
                </div>

                {/* Editable Content */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Isi Script Ara</label>
                  <textarea 
                    rows={8}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    readOnly={!editMode}
                    className={`w-full bg-zinc-900/40 border rounded-2xl px-4 py-3.5 text-sm text-zinc-200 focus:outline-none leading-relaxed transition-all ${
                      editMode ? 'border-purple-500 bg-zinc-900' : 'border-transparent cursor-default'
                    }`}
                  />
                </div>

                {/* Viral Hook */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Viral Hook (Pembuka)</label>
                  <input 
                    type="text"
                    value={editedHook}
                    onChange={(e) => setEditedHook(e.target.value)}
                    readOnly={!editMode}
                    className={`w-full bg-zinc-900/40 border rounded-xl px-3.5 py-2 text-xs italic text-pink-400 focus:outline-none transition-all ${
                      editMode ? 'border-purple-500 bg-zinc-900' : 'border-transparent cursor-default'
                    }`}
                  />
                </div>

                {/* CTA Closing */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">CTA Closing (Penutup)</label>
                  <input 
                    type="text"
                    value={editedCta}
                    onChange={(e) => setEditedCta(e.target.value)}
                    readOnly={!editMode}
                    className={`w-full bg-zinc-900/40 border rounded-xl px-3.5 py-2 text-xs italic text-purple-400 focus:outline-none transition-all ${
                      editMode ? 'border-purple-500 bg-zinc-900' : 'border-transparent cursor-default'
                    }`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 justify-end border-t border-zinc-800 pt-4 mt-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white text-xs font-bold transition-all"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveScript}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/30"
                      >
                        <Check className="w-4 h-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Naskah'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Manual
                      </button>
                      <button
                        onClick={handleSaveScript}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/30"
                      >
                        <Check className="w-4 h-4" />
                        Simpan ke Database
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="glass-panel border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="w-16 h-16 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center text-zinc-500 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-white font-extrabold text-base">Belum Ada Preview</h4>
              <p className="text-zinc-500 text-xs mt-1.5 max-w-sm leading-relaxed font-semibold">
                Silakan isi form kodingan di sebelah kiri lalu klik "Generate Script dengan AI" untuk mulai menyusun materi bersama Ara!
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 5. Naskah Bank List (Bottom Grid) */}
      <div className="space-y-6 pt-6 border-t border-zinc-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Daftar Naskah Ara ({filteredScripts.length})
            </h3>
            <p className="text-xs text-zinc-500 font-semibold mt-1">Daftar naskah yang sudah ter-generate dan tersimpan di database.</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 focus:outline-none transition-all"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 focus:outline-none transition-all"
            >
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        {/* Loading and list states */}
        {loadingScripts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-zinc-900 rounded-3xl border border-zinc-800"></div>
            ))}
          </div>
        ) : filteredScripts.length === 0 ? (
          <div className="glass-panel border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-zinc-500">Tidak ada naskah yang cocok dengan filter kamu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScripts.map(script => {
              // Find matching audio for this script
              const matchedAudio = audios.find((a: any) => a.script_id === script.id);
              
              return (
                <ScriptCard 
                  key={script.id}
                  script={script}
                  audio={matchedAudio}
                  onEdit={handleEditExisting}
                  onDelete={handleDeleteScript}
                  onGenerateAudio={(id) => {
                    router.push(`/audio?script=${id}`);
                  }}
                  onSchedule={(scr, audId) => router.push(`/calendar?script=${scr.id}${audId ? `&audio=${audId}` : ''}`)}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default function ScriptGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="glass-panel border-zinc-900 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 animate-spin">
          <RefreshCw className="w-5 h-5 text-purple-400" />
        </div>
        <h4 className="text-zinc-400 font-bold text-sm">Memuat Script Generator...</h4>
      </div>
    }>
      <ScriptsContent />
    </Suspense>
  );
}
