'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lightbulb, Sparkles, Plus, Trash2, 
  Search, Filter, CheckCircle2, Circle, 
  ArrowRight, TrendingUp, RefreshCw
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';

export default function TopicBankPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Data states
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('javascript');
  const [trendingScore, setTrendingScore] = useState(85);
  const [submitting, setSubmitting] = useState(false);

  // Selection & Filter states
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, used, unused
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'python', label: 'Python' },
    { value: 'node.js', label: 'Node.js' },
    { value: 'database', label: 'Database' },
    { value: 'git', label: 'Git' },
    { value: 'tips', label: 'Tips & Tricks' }
  ];

  // Fetch topics
  const fetchTopics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('trending_score', { ascending: false });
      
      if (error) throw error;
      setTopics(data || []);
    } catch (e) {
      console.error(e);
      showToast('Gagal memuat bank topik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  // Add manual topic
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) {
      showToast('Keyword topik wajib diisi', 'warning');
      return;
    }

    setSubmitting(true);
    const newTopic = {
      keyword,
      category,
      trending_score: trendingScore || 50,
      used: false
    };

    try {
      const { error } = await supabase.from('topics').insert(newTopic);
      if (error) {
        showToast('Gagal menambahkan topik', 'error');
      } else {
        showToast('Topik ide berhasil ditambahkan ke bank!', 'success');
        setKeyword('');
        setTrendingScore(85);
        fetchTopics();
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete single topic
  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus ide topik ini?')) return;
    try {
      const { error } = await supabase.from('topics').delete().eq('id', id);
      if (error) {
        showToast('Gagal menghapus topik', 'error');
      } else {
        showToast('Topik berhasil dihapus', 'success');
        fetchTopics();
      }
    } catch (e) {
      console.error(e);
      showToast('Terjadi kesalahan', 'error');
    }
  };

  // Toggle selection
  const handleSelectTopic = (id: string) => {
    setSelectedTopics(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Select all visible topics
  const handleSelectAll = (visibleTopics: any[]) => {
    if (selectedTopics.length === visibleTopics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(visibleTopics.map(t => t.id));
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedTopics.length === 0) return;
    if (!confirm(`Hapus ${selectedTopics.length} topik terpilih?`)) return;

    try {
      for (const id of selectedTopics) {
        await supabase.from('topics').delete().eq('id', id);
      }
      showToast('Berhasil menghapus bulk topik', 'success');
      setSelectedTopics([]);
      fetchTopics();
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses bulk delete', 'error');
    }
  };

  const handleBulkMarkUsed = async (usedState: boolean) => {
    if (selectedTopics.length === 0) return;
    try {
      for (const id of selectedTopics) {
        await supabase.from('topics').update({ used: usedState }).eq('id', id);
      }
      showToast(`Topik berhasil ditandai sebagai ${usedState ? 'terpakai' : 'belum terpakai'}`, 'success');
      setSelectedTopics([]);
      fetchTopics();
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses bulk update', 'error');
    }
  };

  // Redirect to Script Generator
  const handleGenerateScript = (topicObj: any) => {
    // Navigate with pre-filled state
    router.push(`/scripts?auto=true&slot=1`);
    showToast(`Membuat script tentang "${topicObj.keyword}"...`, 'info');
  };

  // Filter topics
  const filteredTopics = topics.filter(t => {
    const matchCat = filterCategory === 'all' || t.category?.toLowerCase() === filterCategory.toLowerCase();
    
    let matchStatus = true;
    if (filterStatus === 'used') matchStatus = t.used === true;
    if (filterStatus === 'unused') matchStatus = t.used === false;

    const matchSearch = t.keyword.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCat && matchStatus && matchSearch;
  });

  const getCategoryColor = (cat?: string) => {
    const c = cat?.toLowerCase() || '';
    if (c === 'html') return 'text-orange-400 bg-orange-950/20 border-orange-850/40';
    if (c === 'css') return 'text-blue-400 bg-blue-950/20 border-blue-850/40';
    if (c === 'javascript' || c === 'js') return 'text-yellow-400 bg-yellow-950/20 border-yellow-850/40';
    if (c === 'react') return 'text-cyan-400 bg-cyan-950/20 border-cyan-850/40';
    if (c === 'python') return 'text-green-400 bg-green-950/20 border-green-850/40';
    return 'text-purple-400 bg-purple-950/20 border-purple-850/40';
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-zinc-900 pb-6">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
          <Lightbulb className="w-8 h-8 text-yellow-500 animate-pulse" />
          Topic Bank Ara
        </h2>
        <p className="text-zinc-400 text-sm mt-1.5 font-medium">
          Simpan ide, keyword, dan topik yang sedang viral. Pilih dan ubah langsung ide terpilih menjadi naskah video coding siap tayang!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Topic manual input (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2 mb-5">
              <Plus className="w-5 h-5 text-yellow-400" />
              Tambah Ide Baru
            </h3>

            <form onSubmit={handleAddTopic} className="space-y-5">
              {/* Keyword Topik */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Ide Topik / Keyword</label>
                <textarea 
                  rows={3}
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Contoh: Belajar Array Map, Filter, Reduce di JS"
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

              {/* Trending score indicator */}
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                  <span>Trending Score (Viralitas)</span>
                  <span className="text-yellow-400 font-extrabold">{trendingScore} Pts</span>
                </div>
                <input 
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={trendingScore}
                  onChange={(e) => setTrendingScore(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-yellow-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-zinc-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-950/20 hover:scale-105"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-zinc-950" />
                    Simpan Ide Topik
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Topic List and filtering (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Filter block */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 p-4 border border-zinc-900 rounded-2xl">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kata kunci..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9.5 pr-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-500 placeholder-zinc-650"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
              {/* Category selector */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              {/* Status selector */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="unused">Belum Dipakai</option>
                <option value="used">Sudah Terpakai</option>
              </select>
            </div>
          </div>

          {/* Bulk actions bar (Visible when topics are selected) */}
          {selectedTopics.length > 0 && (
            <div className="glass-panel-glow border-yellow-500/20 bg-yellow-950/5 px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-slide-up">
              <span className="text-xs font-bold text-yellow-400">
                {selectedTopics.length} Topik Terpilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkMarkUsed(true)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-yellow-500/20 text-yellow-400 rounded-xl text-[10px] font-bold transition-all"
                >
                  Mark Terpakai
                </button>
                <button
                  onClick={() => handleBulkMarkUsed(false)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-[10px] font-bold transition-all"
                >
                  Mark Belum Terpakai
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-950/20 border border-rose-900/30 hover:border-rose-500 text-rose-400 rounded-xl text-[10px] font-bold transition-all"
                >
                  Hapus Ide
                </button>
              </div>
            </div>
          )}

          {/* Topics Grid list */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-zinc-900 rounded-2xl border border-zinc-850"></div>
              ))}
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="glass-panel border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <Lightbulb className="w-12 h-12 text-zinc-650 mb-3" />
              <h4 className="text-zinc-400 font-bold text-sm">Tidak Ada Ide Topik Ditemukan</h4>
              <p className="text-zinc-500 text-xs mt-1.5 max-w-xs leading-relaxed font-semibold">
                Silakan buat kata kunci topik baru menggunakan form di sebelah kiri untuk meramaikan dashboard kamu!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map(topicItem => {
                const isSelected = selectedTopics.includes(topicItem.id);
                
                return (
                  <div
                    key={topicItem.id}
                    onClick={() => handleSelectTopic(topicItem.id)}
                    className={`glass-panel rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-yellow-500/40 bg-zinc-900/60 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                        : 'border-zinc-850 hover:border-zinc-700/80'
                    } relative overflow-hidden group`}
                  >
                    <div className="space-y-3.5">
                      {/* Category & trending badge */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border ${getCategoryColor(topicItem.category)}`}>
                          {topicItem.category}
                        </span>

                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-950/20 px-2 py-0.5 border border-yellow-900/30 rounded-lg flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {topicItem.trending_score} Pts
                        </span>
                      </div>

                      {/* Title */}
                      <p className="text-sm font-extrabold text-white leading-relaxed line-clamp-2 pr-4">
                        {topicItem.keyword}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-zinc-900 pt-3.5 mt-4 flex items-center justify-between text-xs">
                      {/* Used marker */}
                      <span className={`flex items-center gap-1.5 font-bold ${
                        topicItem.used ? 'text-emerald-400' : 'text-zinc-500'
                      }`}>
                        {topicItem.used ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Terpakai</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-zinc-650" />
                            <span>Belum Dipakai</span>
                          </>
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Generate Script */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateScript(topicItem);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] flex items-center gap-1 transition-all group-hover:scale-105 shadow-md shadow-purple-950/20"
                          title="Generate Script"
                        >
                          <span>Generate</span>
                          <ArrowRight className="w-3 h-3 text-white" />
                        </button>

                        {/* Delete single */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTopic(topicItem.id);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800/40 text-zinc-500 hover:text-rose-400 border border-zinc-850 hover:bg-rose-950/20 hover:border-rose-900/30 transition-all"
                          title="Hapus Ide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
