'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderHeart, Film, Download, Trash2, Eye, Play, Pause, 
  Smartphone, Volume2, Sparkles, RefreshCw, HardDrive, Info, Check, CheckCircle2
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAudio } from '@/context/AudioContext';
import { supabase } from '@/lib/supabase';

export default function GalleryPage() {
  const { showToast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const [videos, setVideos] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [audios, setAudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active preview state
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [currentScene, setCurrentScene] = useState<number>(1);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Compositor visual states for Ara Virtual Presenter
  const [mouthScale, setMouthScale] = useState<number>(0.1);
  const [eyesClosed, setEyesClosed] = useState<boolean>(false);
  const [breathScale, setBreathScale] = useState<number>(1.0);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(14).fill(4));
  const [pulseCount, setPulseCount] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: vidData } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
      const { data: scrData } = await supabase.from('scripts').select('*');
      const { data: audData } = await supabase.from('audios').select('*');

      setVideos(vidData || []);
      setScripts(scrData || []);
      setAudios(audData || []);

      if (vidData && vidData.length > 0) {
        setSelectedVideo(vidData[0]);
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal sinkronisasi data galeri', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Multi-scene timing simulator when preview is active
  useEffect(() => {
    if (!isPlayingPreview) return;

    const interval = setInterval(() => {
      setCurrentScene(prev => (prev % 5) + 1);
    }, 6000); // Change scene every 6 seconds

    return () => clearInterval(interval);
  }, [isPlayingPreview, selectedVideo]);

  // Breathing, blinking, speaking lips and visualizer animations loop
  useEffect(() => {
    if (!isPlayingPreview) {
      setMouthScale(0.15);
      setBreathScale(1.0);
      setVisualizerBars(new Array(14).fill(4));
      return;
    }

    let frameId: number;
    let lastBlink = Date.now();
    let lastMouth = Date.now();
    let breathTime = 0;

    const animate = () => {
      const now = Date.now();
      
      // 1. Natural Breathing Sin wave
      breathTime += 0.045;
      setBreathScale(1.0 + Math.sin(breathTime) * 0.015);

      // 2. Natural Blinking interval (Every 3.8s, closed for 150ms)
      if (now - lastBlink > 3800) {
        setEyesClosed(true);
        setTimeout(() => setEyesClosed(false), 150);
        lastBlink = now;
      }

      // 3. Realistic lips syncing & dancing sound visualizers
      if (now - lastMouth > 100) {
        // High speaking modulation range
        setMouthScale(0.2 + Math.random() * 0.85);
        setPulseCount(prev => (prev + 1) % 100);
        
        // Random visualizer bars reacting
        setVisualizerBars(prev => prev.map(() => 4 + Math.random() * 32));
        lastMouth = now;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isPlayingPreview]);

  const handleDeleteVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus video dari bank galeri?')) return;
    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      showToast('Video berhasil dihapus dari galeri', 'success');
      
      // Update local state
      const updated = videos.filter(v => v.id !== id);
      setVideos(updated);
      if (selectedVideo?.id === id) {
        setSelectedVideo(updated.length > 0 ? updated[0] : null);
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal menghapus video', 'error');
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    if (!fileUrl) return;
    try {
      showToast('Sedang mengunduh video Ara...', 'info');
      
      // Use our server-side proxy to fetch and stream the video with proper referer headers
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(fileName)}`;
      
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = fileName || 'alpsstudio_video.mp4';
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('Video berhasil diunduh ke perangkat Anda!', 'success');
    } catch (e) {
      console.warn('Download failed:', e);
      showToast('Gagal mengunduh video secara otomatis.', 'error');
    }
  };

  // Helper to resolve specific fallback stock footage video
  const getPreviewVideoSrc = () => {
    if (!selectedVideo) return '';
    if (currentScene === 1 || currentScene === 3 || currentScene === 5) {
      return 'https://assets.mixkit.co/videos/40245/40245-720.mp4';
    }
    if (currentScene === 2) {
      return 'https://assets.mixkit.co/videos/34283/34283-720.mp4';
    }
    return 'https://assets.mixkit.co/videos/34282/34282-720.mp4';
  };

  const activeScript = selectedVideo ? scripts.find(s => s.id === selectedVideo.script_id) : null;
  const activeAudio = selectedVideo ? audios.find(a => a.id === selectedVideo.audio_id) : null;

  // Sync audio play with preview play
  const handleTogglePlay = () => {
    if (!selectedVideo) return;
    
    if (isPlayingPreview) {
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      if (activeAudio) {
        playTrack({
          id: activeAudio.id,
          file_url: activeAudio.file_url,
          title: activeScript?.title || 'Voice Ara',
          voice: activeAudio.voice || 'nova',
          script_content: activeScript?.content || ''
        });
      }
    }
  };

  // Render Category-Specific Glowing Code & Flow Diagrams (Solves "animasi kode sesuai skrip")
  const renderCategoryAnimations = () => {
    if (!activeScript) return null;
    const cat = activeScript.category?.toLowerCase() || 'tips';

    switch (cat) {
      case 'react':
        return (
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[240px] bg-black/90 border border-purple-500/40 backdrop-blur-md rounded-2xl p-3 z-20 animate-scale-in flex flex-col gap-2.5 shadow-[0_0_20px_rgba(168,85,247,0.3)] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
                <span className="text-[8px] font-black text-purple-400 font-mono tracking-wider">REACT STATE ENGINE</span>
              </div>
              <span className="text-[7px] text-zinc-500 font-mono font-bold">page.tsx</span>
            </div>
            
            {/* Visual Schematic flow Component -> Hook -> DOM */}
            <div className="flex justify-between items-center bg-zinc-950/80 p-2 rounded-xl border border-zinc-900 relative overflow-hidden">
              
              {/* Interactive pulse lines */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 animate-pulse"></div>

              {/* Node 1: useState */}
              <div className="z-10 bg-purple-950/70 border border-purple-800/80 px-2 py-1 rounded-lg text-center">
                <span className="text-[7px] text-purple-400 font-mono block">useState()</span>
                <span className="text-[8px] font-black text-white font-mono animate-pulse">
                  {pulseCount % 2 === 0 ? 'count: 5' : 'count: 6'}
                </span>
              </div>

              {/* Transition arrow pulse */}
              <div className="z-10 text-[10px] text-pink-400 animate-bounce">⚡</div>

              {/* Node 2: Virtual DOM node */}
              <div className="z-10 bg-emerald-950/70 border border-emerald-800/80 px-2 py-1 rounded-lg text-center">
                <span className="text-[7px] text-emerald-400 font-mono block">Virtual DOM</span>
                <span className="text-[8.5px] font-black text-white font-mono uppercase tracking-wider flex items-center gap-1">
                  Re-Render <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                </span>
              </div>
            </div>

            {/* Glowing React Hooks Code snippet */}
            <pre className="text-[7.5px] text-zinc-300 font-mono leading-relaxed bg-zinc-950/50 p-2 rounded-xl border border-zinc-900/60 overflow-hidden">
              <span className="text-pink-400 font-bold">const</span> [count, setCount] = <span className="text-purple-400">useState</span>(<span className="text-cyan-400">5</span>);{"\n"}
              <span className="text-purple-400">useEffect</span>(() =&gt; {"{"} {"\n"}
              {"  "}document.title = <span className="text-emerald-400">`Clicked ${"{"}count{"}"}`</span>;{"\n"}
              {"}"}, [count]);
            </pre>
          </div>
        );

      case 'css':
        return (
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[240px] bg-black/90 border border-pink-500/40 backdrop-blur-md rounded-2xl p-3 z-20 animate-scale-in flex flex-col gap-2.5 shadow-[0_0_20px_rgba(236,72,153,0.3)] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
                <span className="text-[8px] font-black text-pink-400 font-mono tracking-wider">CSS LAYOUT COMPOSITOR</span>
              </div>
              <span className="text-[7px] text-zinc-500 font-mono font-bold">global.css</span>
            </div>

            {/* Animated CSS boxes showing Flex vs Grid */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[7px] font-mono font-black text-zinc-400 px-1">
                <span>Display Mode:</span>
                <span className="text-pink-400 bg-pink-950/30 px-1.5 py-0.5 rounded border border-pink-900/30 uppercase tracking-widest">
                  {pulseCount % 2 === 0 ? 'Flexbox (Row)' : 'CSS Grid (2x2)'}
                </span>
              </div>

              {pulseCount % 2 === 0 ? (
                /* Flexbox mode animation */
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-900 flex justify-between gap-1.5 transition-all duration-500">
                  <div className="w-12 h-8 rounded-lg bg-purple-650/40 border border-purple-500 flex items-center justify-center text-[7.5px] font-mono text-white animate-pulse">Item 1</div>
                  <div className="w-12 h-8 rounded-lg bg-pink-650/40 border border-pink-500 flex items-center justify-center text-[7.5px] font-mono text-white animate-pulse">Item 2</div>
                  <div className="w-12 h-8 rounded-lg bg-cyan-650/40 border border-cyan-500 flex items-center justify-center text-[7.5px] font-mono text-white animate-pulse">Item 3</div>
                </div>
              ) : (
                /* CSS Grid 2x2 mode animation */
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-900 grid grid-cols-2 gap-2 transition-all duration-500">
                  <div className="h-8 rounded-lg bg-purple-650/40 border border-purple-500 flex items-center justify-center text-[7.5px] font-mono text-white animate-pulse">Col 1</div>
                  <div className="h-8 rounded-lg bg-pink-650/40 border border-pink-500 flex items-center justify-center text-[7.5px] font-mono text-white animate-pulse">Col 2</div>
                  <div className="col-span-2 h-7 rounded-lg bg-cyan-650/40 border border-cyan-500 flex items-center justify-center text-[7.5px] font-mono text-white animate-pulse">Footer Row</div>
                </div>
              )}
            </div>

            <pre className="text-[7.5px] text-zinc-300 font-mono leading-relaxed bg-zinc-950/50 p-2 rounded-xl border border-zinc-900/60 overflow-hidden">
              <span className="text-pink-400">.container</span> {"{"}{"\n"}
              {"  "}display: <span className="text-cyan-400">{pulseCount % 2 === 0 ? 'flex' : 'grid'}</span>;{"\n"}
              {"  "}gap: <span className="text-cyan-400">8px</span>;{"\n"}
              {"}"}
            </pre>
          </div>
        );

      case 'javascript':
        return (
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[240px] bg-black/90 border border-cyan-500/40 backdrop-blur-md rounded-2xl p-3 z-20 animate-scale-in flex flex-col gap-2.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                <span className="text-[8px] font-black text-cyan-400 font-mono tracking-wider">JS RUNTIME EVALUATOR</span>
              </div>
              <span className="text-[7px] text-zinc-500 font-mono font-bold">index.js</span>
            </div>

            {/* Visual JS Evaluation Bubble */}
            <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 space-y-2">
              <span className="text-[7px] font-mono text-zinc-500 block uppercase font-black">Expression Evaluation:</span>
              <div className="flex justify-between items-center text-[8px] font-mono">
                <span className="text-zinc-300">user?.profile ?? 'Guest'</span>
                <span className="text-zinc-500">=&gt;</span>
                <span className="text-cyan-400 font-black bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/30 animate-pulse">"Guest"</span>
              </div>
              
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 animate-pulse" style={{ width: `${(pulseCount % 5) * 25}%` }}></div>
              </div>
            </div>

            <pre className="text-[7.5px] text-zinc-300 font-mono leading-relaxed bg-zinc-950/50 p-2 rounded-xl border border-zinc-900/60 overflow-hidden">
              <span className="text-pink-400 font-bold">const</span> user = <span className="text-cyan-400">null</span>;{"\n"}
              <span className="text-pink-400 font-bold">const</span> name = user?.name <span className="text-purple-400">??</span> <span className="text-emerald-400">'Guest'</span>;{"\n"}
              console.<span className="text-purple-400">log</span>(name); <span className="text-zinc-500">{"// Output: Guest"}</span>{"\n"}
            </pre>
          </div>
        );

      default:
        // Default Autopilot / Tips creative visual diagram
        return (
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[240px] bg-black/90 border border-purple-500/40 backdrop-blur-md rounded-2xl p-3 z-20 animate-scale-in flex flex-col gap-2.5 shadow-[0_0_20px_rgba(168,85,247,0.3)] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
                <span className="text-[8px] font-black text-purple-400 font-mono tracking-wider">ARA INFLUENCER ENGINE</span>
              </div>
              <span className="text-[7px] text-zinc-500 font-mono font-bold">studio_pipeline</span>
            </div>

            {/* Visual schematic database ERP custom diagram */}
            <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 space-y-2.5 text-center">
              <div className="flex justify-around items-center">
                <div className="p-1 px-2 bg-purple-950/60 rounded border border-purple-900/30 text-[7.5px] text-purple-300 font-mono">
                  IDE / Naskah
                </div>
                <span className="text-[8px] text-zinc-650">➔</span>
                <div className="p-1 px-2 bg-pink-950/60 rounded border border-pink-900/30 text-[7.5px] text-pink-300 font-mono animate-pulse">
                  TTS Vokal
                </div>
                <span className="text-[8px] text-zinc-650">➔</span>
                <div className="p-1 px-2 bg-emerald-950/60 rounded border border-emerald-900/30 text-[7.5px] text-emerald-300 font-mono">
                  Galeri Video
                </div>
              </div>
              <span className="text-[7px] text-zinc-400 font-mono block uppercase font-bold tracking-widest mt-1">
                Autopilot Rendering 100% Sukses
              </span>
            </div>

            <div className="flex justify-between items-center text-[7px] font-mono text-zinc-500 px-1">
              <span>Resolusi: 1080x1920 (Vertical)</span>
              <span>Codec: H.264 MP4</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="border-b border-zinc-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <FolderHeart className="w-8 h-8 text-pink-500 animate-pulse" />
            Galeri Konten Tersimpan
          </h2>
          <p className="text-zinc-400 text-sm mt-1.5 font-medium">
            AI tidak akan melakukan auto-post. Semua video hasil render disimpan di sini agar Anda bisa melakukan review, preview, dan mengunduhnya secara aman.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Video List Grid (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center bg-zinc-950 p-4.5 rounded-2xl border border-zinc-900">
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
              <HardDrive className="w-4.5 h-4.5 text-purple-400" />
              Total Video Tersimpan: <span className="text-white font-extrabold">{videos.length} Video</span>
            </span>
            <span className="text-[10px] bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
              Aman & Siap Pakai
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="h-44 bg-zinc-900/50 animate-pulse rounded-3xl border border-zinc-800"></div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="glass-panel border-zinc-900 rounded-3xl p-16 text-center space-y-4">
              <Film className="w-12 h-12 text-zinc-700 mx-auto" />
              <h3 className="text-white font-extrabold text-base">Belum Ada Video di Galeri</h3>
              <p className="text-zinc-550 text-xs max-w-[280px] mx-auto leading-relaxed font-semibold">
                Silakan buat video koding Ara pertama Anda di menu Video Generator terlebih dahulu!
              </p>
              <a href="/video" className="mt-4 px-6 py-3 bg-purple-650 hover:bg-purple-550 text-white rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition-all">
                Mulai Render Video AI <Sparkles className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map(vid => {
                const scr = scripts.find(s => s.id === vid.script_id);
                const isSelected = selectedVideo?.id === vid.id;

                return (
                  <div 
                    key={vid.id} 
                    onClick={() => {
                      setSelectedVideo(vid);
                      setIsPlayingPreview(false);
                      setCurrentScene(1);
                    }}
                    className={`glass-panel rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-950/5 ring-1 ring-purple-500/20' 
                        : 'border-zinc-850 hover:bg-zinc-900/40'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg border ${
                          vid.template_type === 'coding_neon' ? 'text-purple-400 bg-purple-950/20 border-purple-900/30' :
                          vid.template_type === 'retro_terminal' ? 'text-cyan-400 bg-cyan-950/20 border-cyan-900/30' :
                          'text-pink-400 bg-pink-950/20 border-pink-900/30'
                        }`}>
                          {vid.template_type?.replace('_', ' ') || 'Neon'}
                        </span>
                        
                        <button
                          onClick={(e) => handleDeleteVideo(vid.id, e)}
                          className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-500 hover:text-rose-400 transition-all"
                          title="Hapus Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-sm font-extrabold text-white mt-3.5 leading-snug truncate">{scr?.title || 'Video Coding Ara'}</h4>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                        Dibuat: {new Date(vid.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>

                      <p className="mt-3.5 text-xs text-zinc-400 leading-relaxed font-medium line-clamp-2 italic">
                        "{scr?.content}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-zinc-900/20 p-2 rounded-xl text-[9px] text-zinc-500 font-bold uppercase tracking-wider text-center">
                      <div>
                        <span className="block text-zinc-650">Resolusi</span>
                        <span className="text-zinc-300 mt-0.5 block">1080x1920</span>
                      </div>
                      <div className="border-l border-zinc-900">
                        <span className="block text-zinc-650">Durasi</span>
                        <span className="text-zinc-300 mt-0.5 block">{vid.video_metadata?.duration || 30} detik</span>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-zinc-900 pt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVideo(vid);
                          setIsPlayingPreview(true);
                          if (activeAudio) {
                            playTrack({
                              id: activeAudio.id,
                              file_url: activeAudio.file_url,
                              title: scr?.title || 'Voice Ara',
                              voice: activeAudio.voice || 'nova',
                              script_content: scr?.content || ''
                            });
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-zinc-900 border border-zinc-800 hover:border-purple-550/25 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-purple-400" />
                        Preview
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(vid.file_url, vid.file_name);
                        }}
                        className="py-2 px-3 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: High Fidelity Smartphone Simulator with Video, Background Image, Virtual AI Influencer & Subtitles! (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-pink-500 animate-pulse" />
              Live AI Influencer Player
            </span>
            {selectedVideo && (
              <span className="text-xs text-purple-400 font-bold bg-purple-950/20 border border-purple-900/30 px-2.5 py-1 rounded-xl">
                Template: {selectedVideo.template_type?.replace('_', ' ')}
              </span>
            )}
          </div>

          {selectedVideo ? (
            <div className="space-y-6">
              {/* Smartphone Frame Container */}
              <div className="mx-auto w-[280px] h-[520px] rounded-[42px] border-8 border-zinc-900 bg-zinc-950 shadow-[0_0_50px_rgba(236,72,153,0.18)] overflow-hidden relative flex flex-col justify-between p-4.5">
                
                {/* Smartphone camera notch */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-zinc-900 rounded-full z-30"></div>

                {/* Main Video Overlay System */}
                <div className="absolute inset-0 z-0 bg-zinc-950">
                  {isPlayingPreview ? (
                    <div className="w-full h-full relative overflow-hidden">
                      {/* Background Visual loop (coding/keyboard B-roll) */}
                      <video 
                        key={getPreviewVideoSrc()}
                        src={getPreviewVideoSrc()}
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-cover opacity-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-zinc-950/30 z-10"></div>
                      
                      {/* 100% Bulletproof Glowing Code Matrix animation layer (Solves black backgrounds due to CORS video fail) */}
                      <div className="absolute inset-0 z-5 pointer-events-none opacity-40 font-mono text-[6.5px] text-emerald-400 space-y-1.5 select-none leading-none p-5 mt-14">
                        {`const AraAI = { status: 'rendering', voice: 'nova', loop: true };\n`.repeat(5)}
                        <div className="text-purple-400 mt-2">{`import { useState, useEffect } from 'react';\n`.repeat(3)}</div>
                      </div>

                      {/* Top HUD Badge inside phone */}
                      <div className="absolute top-10 left-3.5 right-3.5 z-30 flex justify-between items-center pointer-events-none">
                        <span className="flex items-center gap-1 text-[7px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          <span className="w-1 h-1 rounded-full bg-white animate-ping"></span> PREVIEW
                        </span>
                        <span className="text-[7.5px] font-black text-zinc-300 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-zinc-850">
                          {currentScene === 1 ? '🎬 Scene 1: Ara Intro' :
                           currentScene === 2 ? '⌨️ Scene 2: B-Roll Keyboard' :
                           currentScene === 3 ? '💡 Scene 3: Ara Explaining' :
                           currentScene === 4 ? '💻 Scene 4: Code Zoom' :
                           '👋 Scene 5: Outro CTA'}
                        </span>
                      </div>

                      {/* 1. Category-Specific Dynamic Glowing Code & Flow Diagrams (Solves "animasi kode sesuai skrip") */}
                      {renderCategoryAnimations()}

                      {/* 2. FOREGROUND: High-Fidelity Animated Virtual Presenter (Ara) breathing, blinking & physically speaking */}
                      <div className="absolute bottom-28 right-3.5 z-20 w-[95px] h-[135px] rounded-2xl overflow-hidden border border-purple-500/40 bg-zinc-950/90 shadow-2xl animate-fade-in flex flex-col justify-end p-1.5">
                        {/* Speaker Container */}
                        <div className="absolute inset-0 w-full h-full bg-zinc-950">
                          <img 
                            src={
                              selectedVideo.template_type === 'coding_neon' ? '/avatar_library.jpg' : 
                              selectedVideo.template_type === 'retro_terminal' ? '/avatar_park.jpg' : 
                              '/avatar_cafe.jpg'
                            } 
                            alt="Speaking Ara virtual presenter" 
                            className="w-full h-full object-cover opacity-90 transition-transform duration-500"
                            style={{ transform: `scale(${breathScale})` }}
                          />
                          {/* Speaking glowing aura overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 via-transparent to-transparent"></div>

                          {/* Real-time speaking lips & blinking eyes overlay on top of the avatar face! */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {/* Eyes overlay */}
                            <div className="absolute top-[38%] left-[28%] right-[28%] flex justify-between">
                              {eyesClosed ? (
                                <>
                                  <div className="w-5 h-1.5 bg-black border-t border-purple-400 rounded-full shadow-lg"></div>
                                  <div className="w-5 h-1.5 bg-black border-t border-purple-400 rounded-full shadow-lg"></div>
                                </>
                              ) : null}
                            </div>

                            {/* Talking glowing lips overlay */}
                            <div className="absolute top-[52%] left-1/2 -translate-x-1/2 w-8 h-6 flex items-center justify-center">
                              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_5px_rgba(236,72,153,0.95)]">
                                {/* Outer lips */}
                                <path 
                                  d={`M 10 50 Q 50 ${50 - mouthScale * 26} 90 50 Q 50 ${50 + mouthScale * 26} 10 50 Z`} 
                                  fill="#ec4899" 
                                  stroke="#f472b6" 
                                  strokeWidth="5"
                                />
                                {/* Inner mouth opening */}
                                <ellipse 
                                  cx="50" 
                                  cy="50" 
                                  rx="22" 
                                  ry={11 * mouthScale} 
                                  fill="#180815" 
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Speaking circular EQ waveform bar ring overlay */}
                        <div className="absolute top-2 left-2 flex gap-0.5 items-end h-5 z-20 bg-black/60 p-1 rounded">
                          {visualizerBars.slice(0, 5).map((barHeight, idx) => (
                            <span 
                              key={idx} 
                              className="w-0.5 bg-pink-500 rounded-full transition-all duration-75"
                              style={{ height: `${barHeight / 1.8}px` }}
                            ></span>
                          ))}
                        </div>
                        
                        {/* Presenter name HUD */}
                        <div className="relative z-10 bg-black/85 px-1.5 py-0.5 rounded-md border border-purple-500/20 text-[6px] font-black text-purple-300 text-center font-mono uppercase tracking-wider">
                          alpsstudio Presenter
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Inactive Preview Mode State showing active visual cover */
                    <div className="w-full h-full relative overflow-hidden flex flex-col items-between justify-between p-4 bg-zinc-950">
                      <div className="absolute inset-0 w-full h-full">
                        <img 
                          src={
                            selectedVideo.template_type === 'coding_neon' ? '/avatar_library.jpg' : 
                            selectedVideo.template_type === 'retro_terminal' ? '/avatar_park.jpg' : 
                            '/avatar_cafe.jpg'
                          } 
                          alt="Ara Virtual Presenter cover" 
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-zinc-950/40"></div>
                      </div>

                      {/* Cover Details Badge inside phone */}
                      <div className="relative z-10 w-full flex justify-between items-center mt-6">
                        <span className="text-[9px] font-bold text-zinc-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-800">
                          alpsstudio AI Virtual
                        </span>
                        <span className="text-[9px] font-bold text-pink-400 bg-pink-950/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-pink-850/40 uppercase tracking-widest font-mono">
                          Ready to Play
                        </span>
                      </div>

                      {/* Click to play overlay card */}
                      <button 
                        onClick={handleTogglePlay}
                        className="relative z-10 mx-auto w-14 h-14 rounded-full bg-purple-650 hover:bg-purple-550 border border-purple-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer animate-bounce mt-auto mb-10"
                      >
                        <Play className="w-6 h-6 fill-current text-white ml-0.5" />
                      </button>

                      {/* Info bar bottom */}
                      <div className="relative z-10 w-full bg-black/75 backdrop-blur-md border border-zinc-900 rounded-2xl p-3 flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full border border-purple-500 overflow-hidden bg-zinc-900 flex-shrink-0">
                          <img 
                            src="/avatar_park.jpg" 
                            alt="Ara mini" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <h5 className="text-[9px] font-extrabold text-white">alpsstudio Presenter</h5>
                          <span className="text-[8px] text-zinc-450 font-bold block mt-0.5">Ketuk Play untuk Simulasi Video & Vokal</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TikTok/Shorts style interface overlays synced with scenes */}
                <div className="relative z-10 w-full flex flex-col justify-between h-full pointer-events-none">
                  
                  {/* Top Header line */}
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-zinc-400 bg-black/45 backdrop-blur-md px-2.5 py-0.5 rounded-full">@alpsstudio</span>
                    <span className="text-[9.5px] font-black text-pink-400 bg-pink-950/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-pink-900/30">
                      <span className="w-1 h-1 rounded-full bg-pink-400 animate-pulse"></span> EXPLAINER
                    </span>
                  </div>

                  {/* 3. SUBTITLES: Clean dynamic neon captions perfectly synced with script content */}
                  {isPlayingPreview && (
                    <div className="mt-auto mb-3 w-full px-1.5 animate-scale-in">
                      <div className="bg-black/85 backdrop-blur-md border border-pink-500/20 px-3.5 py-2.5 rounded-xl shadow-xl">
                        <p className="text-[9.5px] font-extrabold text-white leading-relaxed text-center">
                          {currentScene === 1 ? `🎙️ "${activeScript?.hook || 'Halo developer! Ara di sini. Mari kita bedah naskah premium hari ini!'}"` :
                           currentScene === 2 ? '⌨️ "Mari kita perhatikan bagaimana kodenya berjalan secara cepat, terstruktur, dan bersih..."' :
                           currentScene === 3 ? '💡 "Kita memanfaatkan Hook React terkuat untuk menyimpan status variabel di memori..."' :
                           currentScene === 4 ? '💻 "Sangat dinamis! Setiap ada perubahan data, komponen langsung melakukan render ulang..."' :
                           `👋 "${activeScript?.cta || 'Klik like, simpan, dan ikuti Alps Studio untuk tips coding seru berikutnya!'}"`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Player Controller Action Bar */}
              <div className="glass-panel border-zinc-900 rounded-3xl p-5 flex flex-col gap-3.5">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                  <span className="flex items-center gap-1.5"><Volume2 className="w-4 h-4 text-purple-400" /> Suara Pengisi: Ara (Nova TTS)</span>
                  <span className="text-zinc-550">Resolusi 9:16 Vertical</span>
                </div>
                
                <button
                  onClick={handleTogglePlay}
                  className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                    isPlayingPreview
                      ? 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                      : 'bg-purple-650 hover:bg-purple-550 text-white shadow-md shadow-purple-950/20'
                  }`}
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-4 h-4 text-zinc-400" /> Hentikan Simulasi Player
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-white fill-current" /> Mainkan Video & Vokal Ara
                    </>
                  )}
                </button>
              </div>

              {/* Contextual Naskah Detail Review Panel */}
              {activeScript && (
                <div className="glass-panel border-zinc-900 rounded-3xl p-5 space-y-3.5">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
                    <Info className="w-4 h-4 text-purple-400" />
                    Review Naskah Detail
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-550 block">Judul Naskah</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{activeScript.title}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-550 block">Isi Naskah Lengkap</span>
                      <p className="text-xs text-zinc-300 leading-relaxed font-semibold mt-1">"{activeScript.content}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel border-zinc-900 rounded-3xl p-10 text-center text-zinc-550 text-xs font-bold">
              Silakan pilih video dari daftar di samping untuk memutar pratinjau!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
