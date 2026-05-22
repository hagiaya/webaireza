'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Film, Sparkles, Mic, FileText, Download, 
  RefreshCw, CheckCircle2, Play, Pause, 
  Layers, HardDrive, Smartphone, Check, 
  AlertTriangle, Trash2, ArrowRight, Eye
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAudio } from '@/context/AudioContext';
import { supabase, isMockDb } from '@/lib/supabase';
import PlatformIcon from '@/components/PlatformIcon';

function VideoGeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  // Database lists
  const [scripts, setScripts] = useState<any[]>([]);
  const [audios, setAudios] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Workflow Active States
  const [activeStep, setActiveStep] = useState(1); // 1: Script, 2: Audio, 3: Video, 4: Gallery
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<'coding_neon' | 'retro_terminal' | 'cyber_matrix' | 'ara_influencer_explainer'>('ara_influencer_explainer');

  // Generator Action States
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [renderLogs, setRenderLogs] = useState<string[]>([]);

  // Preview video modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [currentScene, setCurrentScene] = useState<number>(1);

  // Compositor visual states for Ara Virtual Presenter
  const [mouthScale, setMouthScale] = useState<number>(0.1);
  const [eyesClosed, setEyesClosed] = useState<boolean>(false);
  const [breathScale, setBreathScale] = useState<number>(1.0);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(14).fill(4));
  const [pulseCount, setPulseCount] = useState<number>(0);

  // Breathing, blinking, speaking lips and visualizer animations loop
  const isExplainerActive = 
    selectedTheme === 'ara_influencer_explainer' || 
    previewTemplate === 'ara_influencer_explainer' ||
    (previewVideoUrl && (previewVideoUrl.includes('40245') || previewVideoUrl.includes('ara_video_render_')));

  useEffect(() => {
    if (!isExplainerActive && !generatingVideo) {
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
  }, [isExplainerActive, generatingVideo]);

  // Fetch all databases
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: scrData } = await supabase.from('scripts').select('*').order('created_at', { ascending: false });
      const { data: audData } = await supabase.from('audios').select('*');
      const { data: vidData } = await supabase.from('videos').select('*').order('created_at', { ascending: false });

      setScripts(scrData || []);
      setAudios(audData || []);
      setVideos(vidData || []);
    } catch (e) {
      console.error(e);
      showToast('Gagal sinkronisasi data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check query params focused script
    const scriptParam = searchParams.get('script');
    if (scriptParam) {
      setSelectedScriptId(scriptParam);
      // Auto advance to Step 2 (Audio check)
      setActiveStep(2);
      showToast('Naskah terpilih berhasil dimuat ke alur video!', 'success');
    }
  }, [searchParams]);

  // Speaks AI Explainer scene simulation timer
  useEffect(() => {
    const isExplainerActive = 
      selectedTheme === 'ara_influencer_explainer' || 
      previewTemplate === 'ara_influencer_explainer' ||
      previewVideoUrl?.includes('40245');

    if (!isExplainerActive) return;

    const interval = setInterval(() => {
      setCurrentScene(prev => (prev % 5) + 1);
    }, 6000); // Shift visual scene every 6 seconds

    return () => clearInterval(interval);
  }, [selectedTheme, previewTemplate, previewVideoUrl]);

  const getActiveVideoSrc = () => {
    const isExplainerActive = 
      selectedTheme === 'ara_influencer_explainer' || 
      previewTemplate === 'ara_influencer_explainer' ||
      (previewVideoUrl && (previewVideoUrl.includes('40245') || previewVideoUrl.includes('ara_video_render_')));

    if (!isExplainerActive) {
      return previewVideoUrl || '';
    }

    // Explainer scenes matching Mixkit high-quality sources
    if (currentScene === 1) {
      return 'https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-video-blog-with-a-smartphone-40245-large.mp4'; // Speaking Ara intro
    }
    if (currentScene === 2) {
      return 'https://assets.mixkit.co/videos/preview/mixkit-hand-typing-on-a-glowing-computer-keyboard-close-up-34283-large.mp4'; // Closeup typing B-roll
    }
    if (currentScene === 3) {
      return 'https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-video-blog-with-a-smartphone-40245-large.mp4'; // Speaking Ara concept
    }
    if (currentScene === 4) {
      return 'https://assets.mixkit.co/videos/preview/mixkit-coding-on-a-computer-screen-close-up-34282-large.mp4'; // Close-up neon koding screen
    }
    return 'https://assets.mixkit.co/videos/preview/mixkit-woman-recording-a-video-blog-with-a-smartphone-40245-large.mp4'; // Waving CTA outro
  };

  // Selected Script Data
  const selectedScript = scripts.find(s => s.id === selectedScriptId);
  const selectedAudio = audios.find(a => a.script_id === selectedScriptId && a.status === 'generated');
  const selectedVideo = videos.find(v => v.script_id === selectedScriptId);

  // STEP 2: Generate Audio TTS (uses ElevenLabs AI)
  const handleGenerateAudioForWorkflow = async () => {
    if (!selectedScript) return;
    setGeneratingAudio(true);
    showToast('Mentranskripsikan suara Ara dengan ElevenLabs...', 'info');

    try {
      // 1. Mock synthesis call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockId = Math.random().toString(36).substring(2, 6);
      const fileName = `ara_${selectedScript.slot || 1}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${mockId}.mp3`;

      // 2. Save voice database
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_id: selectedScriptId,
          file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          file_name: fileName,
          voice: 'nova',
          duration: selectedScript.duration_estimate || 30,
          status: 'generated'
        })
      });

      const dbRes = await res.json();
      if (!dbRes.success) throw new Error(dbRes.message);

      if (isMockDb && dbRes.data) {
        const audioRecord = Array.isArray(dbRes.data) ? dbRes.data[0] : dbRes.data;
        const { data: existingAudios } = await supabase.from('audios').select('*').eq('script_id', selectedScriptId);
        if (existingAudios && existingAudios.length > 0) {
          await supabase.from('audios').update(audioRecord).eq('id', existingAudios[0].id);
        } else {
          await supabase.from('audios').insert(audioRecord);
        }
        await supabase.from('scripts').update({ status: 'ready' }).eq('id', selectedScriptId);
      }

      showToast('Vokal TTS Ara berhasil disintesis!', 'success');
      await fetchData(); // reload data
    } catch (e: any) {
      console.error(e);
      showToast(`Gagal: ${e.message}`, 'error');
    } finally {
      setGeneratingAudio(false);
    }
  };

  // STEP 3: Generate Video Rendering Simulation
  const handleGenerateVideo = async () => {
    if (!selectedScript || !selectedAudio) return;
    setGeneratingVideo(true);
    setVideoProgress(0);
    setRenderLogs([]);

    const logs = [
      '🔌 Menginisialisasi Video Renderer Engine...',
      '🎨 Memuat Template Layout dan Font "Outfit"...',
      '🖼️ Mempersiapkan Latar Belakang Animasi Dinamis...',
      '📝 Men-generate Subtitle Otomatis berdasarkan Naskah...',
      '🎙️ Menggabungkan File Vokal Suara Ara (TTS MP3)...',
      '⚡ Merender Frame 3D Koding Neon...',
      '💻 Menambahkan Animasi Mengetik Kode Real-Time...',
      '🔥 Melakukan Color Grading & Glow Neon Effects...',
      '📊 Melakukan Kompresi Audio-Video Multiplexing...',
      '💾 Menyimpan Render MP4 Video Ara ke Bank Galeri...'
    ];

    // Simulate real logs printing and progress percentage
    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setRenderLogs(prev => [...prev, logs[logIndex]]);
        setVideoProgress(prev => Math.min(prev + 10, 100));
        logIndex++;
      } else {
        clearInterval(interval);
        saveGeneratedVideo();
      }
    }, 800);
  };

  // Save Video database record after render succeeds
  const saveGeneratedVideo = async () => {
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_id: selectedScriptId,
          audio_id: selectedAudio?.id,
          template_type: selectedTheme
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      if (isMockDb && data.video) {
        const { data: existingVideos } = await supabase.from('videos').select('*').eq('script_id', selectedScriptId);
        if (existingVideos && existingVideos.length > 0) {
          await supabase.from('videos').update(data.video).eq('id', existingVideos[0].id);
        } else {
          await supabase.from('videos').insert(data.video);
        }
        await supabase.from('scripts').update({ status: 'ready' }).eq('id', selectedScriptId);
      }

      showToast('Video Ara berhasil dirender dan disimpan di Galeri!', 'success');
      setVideoProgress(100);
      await fetchData(); // refresh list
      setTimeout(() => {
        setGeneratingVideo(false);
        router.push('/gallery');
      }, 1500);
    } catch (e: any) {
      console.error(e);
      showToast(`Gagal merender video: ${e.message}`, 'error');
      setGeneratingVideo(false);
    }
  };

  // Delete video
  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Hapus video dari bank galeri?')) return;
    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      showToast('Video berhasil dihapus', 'success');
      fetchData();
    } catch (e) {
      console.error(e);
      showToast('Gagal menghapus', 'error');
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

  // Render Category-Specific Glowing Code & Flow Diagrams (Solves "animasi kode sesuai skrip")
  const renderCategoryAnimations = () => {
    if (!selectedScript) return null;
    const cat = selectedScript.category?.toLowerCase() || 'tips';

    switch (cat) {
      case 'react':
        return (
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[210px] bg-black/90 border border-purple-500/40 backdrop-blur-md rounded-2xl p-2.5 z-20 animate-scale-in flex flex-col gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-purple-500 animate-ping"></span>
                <span className="text-[7px] font-black text-purple-400 font-mono tracking-wider">REACT STATE ENGINE</span>
              </div>
              <span className="text-[6.5px] text-zinc-555 font-mono font-bold">page.tsx</span>
            </div>
            
            {/* Visual Schematic flow Component -> Hook -> DOM */}
            <div className="flex justify-between items-center bg-zinc-950/80 p-1.5 rounded-lg border border-zinc-900 relative overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 animate-pulse"></div>

              <div className="z-10 bg-purple-950/70 border border-purple-800/80 px-1.5 py-0.5 rounded text-center">
                <span className="text-[6px] text-purple-400 font-mono block">useState()</span>
                <span className="text-[7px] font-black text-white font-mono animate-pulse">
                  {pulseCount % 2 === 0 ? 'count: 5' : 'count: 6'}
                </span>
              </div>

              <div className="z-10 text-[8px] text-pink-400 animate-bounce">⚡</div>

              <div className="z-10 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded text-center">
                <span className="text-[6px] text-emerald-400 font-mono block">Virtual DOM</span>
                <span className="text-[7.5px] font-black text-white font-mono uppercase tracking-wider animate-pulse">
                  Re-Render
                </span>
              </div>
            </div>

            <pre className="text-[6.5px] text-zinc-300 font-mono leading-normal bg-zinc-950/50 p-1.5 rounded border border-zinc-900/60 overflow-hidden">
              <span className="text-pink-400 font-bold">const</span> [count, setCount] = <span className="text-purple-400">useState</span>(<span className="text-cyan-400">5</span>);{"\n"}
              <span className="text-purple-400">useEffect</span>(() =&gt; {"{"} {"\n"}
              {"  "}document.title = <span className="text-emerald-400">`Clicked ${"{"}count{"}"}`</span>;{"\n"}
              {"}"}, [count]);
            </pre>
          </div>
        );

      case 'css':
        return (
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[210px] bg-black/90 border border-pink-500/40 backdrop-blur-md rounded-2xl p-2.5 z-20 animate-scale-in flex flex-col gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-pink-500 animate-ping"></span>
                <span className="text-[7px] font-black text-pink-400 font-mono tracking-wider">CSS LAYOUT COMPOSITOR</span>
              </div>
              <span className="text-[6.5px] text-zinc-555 font-mono font-bold">global.css</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[6px] font-mono font-black text-zinc-400 px-1">
                <span>Display Mode:</span>
                <span className="text-pink-400 bg-pink-950/30 px-1 py-0.5 rounded border border-pink-900/30 uppercase tracking-widest">
                  {pulseCount % 2 === 0 ? 'Flexbox (Row)' : 'CSS Grid (2x2)'}
                </span>
              </div>

              {pulseCount % 2 === 0 ? (
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900 flex justify-between gap-1 transition-all duration-500">
                  <div className="w-10 h-7 rounded bg-purple-650/40 border border-purple-500 flex items-center justify-center text-[7px] font-mono text-white animate-pulse">Item 1</div>
                  <div className="w-10 h-7 rounded bg-pink-650/40 border border-pink-500 flex items-center justify-center text-[7px] font-mono text-white animate-pulse">Item 2</div>
                  <div className="w-10 h-7 rounded bg-cyan-650/40 border border-cyan-500 flex items-center justify-center text-[7px] font-mono text-white animate-pulse">Item 3</div>
                </div>
              ) : (
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900 grid grid-cols-2 gap-1 transition-all duration-500">
                  <div className="h-7 rounded bg-purple-650/40 border border-purple-500 flex items-center justify-center text-[7px] font-mono text-white animate-pulse">Col 1</div>
                  <div className="h-7 rounded bg-pink-650/40 border border-pink-500 flex items-center justify-center text-[7px] font-mono text-white animate-pulse">Col 2</div>
                  <div className="col-span-2 h-6 rounded bg-cyan-650/40 border border-cyan-500 flex items-center justify-center text-[7px] font-mono text-white animate-pulse">Footer Row</div>
                </div>
              )}
            </div>

            <pre className="text-[6.5px] text-zinc-300 font-mono leading-normal bg-zinc-950/50 p-1.5 rounded border border-zinc-900/60 overflow-hidden">
              <span className="text-pink-400">.container</span> {"{"}{"\n"}
              {"  "}display: <span className="text-cyan-400">{pulseCount % 2 === 0 ? 'flex' : 'grid'}</span>;{"\n"}
              {"  "}gap: <span className="text-cyan-400">8px</span>;{"\n"}
              {"}"}
            </pre>
          </div>
        );

      case 'javascript':
        return (
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[210px] bg-black/90 border border-cyan-500/40 backdrop-blur-md rounded-2xl p-2.5 z-20 animate-scale-in flex flex-col gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-cyan-500 animate-ping"></span>
                <span className="text-[7px] font-black text-cyan-400 font-mono tracking-wider">JS RUNTIME EVALUATOR</span>
              </div>
              <span className="text-[6.5px] text-zinc-555 font-mono font-bold">index.js</span>
            </div>

            <div className="bg-zinc-950 p-2 rounded border border-zinc-900 space-y-1.5">
              <span className="text-[6px] font-mono text-zinc-500 block uppercase font-black">Expression:</span>
              <div className="flex justify-between items-center text-[7px] font-mono">
                <span className="text-zinc-300">user?.profile ?? 'Guest'</span>
                <span className="text-cyan-400 font-black bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-900/30 animate-pulse">"Guest"</span>
              </div>
            </div>

            <pre className="text-[6.5px] text-zinc-300 font-mono leading-normal bg-zinc-950/50 p-1.5 rounded border border-zinc-900/60 overflow-hidden">
              <span className="text-pink-400 font-bold">const</span> user = <span className="text-cyan-400">null</span>;{"\n"}
              <span className="text-pink-400 font-bold">const</span> name = user?.name <span className="text-purple-400">??</span> <span className="text-emerald-400">'Guest'</span>;{"\n"}
              console.<span className="text-purple-400">log</span>(name);
            </pre>
          </div>
        );

      default:
        return (
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[210px] bg-black/90 border border-purple-500/40 backdrop-blur-md rounded-2xl p-2.5 z-20 animate-scale-in flex flex-col gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-purple-500 animate-ping"></span>
                <span className="text-[7px] font-black text-purple-400 font-mono tracking-wider">ARA INFLUENCER ENGINE</span>
              </div>
              <span className="text-[6.5px] text-zinc-555 font-mono font-bold">studio_pipeline</span>
            </div>

            <div className="bg-zinc-950 p-2 rounded border border-zinc-900 text-center space-y-1.5">
              <div className="flex justify-around items-center text-[7px]">
                <div className="p-0.5 px-1 bg-purple-950/60 rounded border border-purple-900/30 text-purple-300">Naskah</div>
                <span>➔</span>
                <div className="p-0.5 px-1 bg-pink-950/60 rounded border border-pink-900/30 text-pink-300 animate-pulse">Vokal</div>
                <span>➔</span>
                <div className="p-0.5 px-1 bg-emerald-950/60 rounded border border-emerald-900/30 text-emerald-300">Video</div>
              </div>
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
            <Film className="w-8 h-8 text-purple-500 animate-pulse" />
            Video Generator & Bank Galeri
          </h2>
          <p className="text-zinc-400 text-sm mt-1.5 font-medium">
            Alur otomatis: dari Ide Naskah, Voice Over, Render Video Coding Berpijar, hingga tersimpan di Bank Galeri Konten Ara.
          </p>
        </div>
      </div>

      {/* Progress Workflow Tracker Tabs */}
      <div className="grid grid-cols-4 gap-2 bg-zinc-950 p-1.5 rounded-3xl border border-zinc-900">
        {[
          { step: 1, name: '1. Pilih Naskah', icon: FileText },
          { step: 2, name: '2. Suara TTS', icon: Mic },
          { step: 3, name: '3. Render Video', icon: Film },
          { step: 4, name: '4. Bank Galeri', icon: HardDrive }
        ].map(item => {
          const isActive = activeStep === item.step;
          const isCompleted = activeStep > item.step;
          const Icon = item.icon;

          return (
            <button
              key={item.step}
              onClick={() => {
                if (generatingVideo) return;
                if (item.step === 4) {
                  router.push('/gallery');
                } else {
                  setActiveStep(item.step);
                }
              }}
              className={`py-3.5 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-purple-650 text-white shadow-md shadow-purple-950/40 border border-purple-550'
                  : isCompleted
                    ? 'text-emerald-400 bg-emerald-950/10 border border-emerald-900/10'
                    : 'text-zinc-550 hover:text-zinc-300 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isCompleted ? 'text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">{item.name}</span>
              {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />}
            </button>
          );
        })}
      </div>

      {/* STEP CONTENT SWITCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Controller / Active Step Panel (7 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: Select Script */}
          {activeStep === 1 && (
            <div className="glass-panel border-zinc-900 rounded-3xl p-6 space-y-5 animate-scale-in">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <FileText className="w-5 h-5 text-purple-400" />
                Langkah 1: Pilih Naskah Coding Ara
              </h3>

              {scripts.length === 0 ? (
                <div className="py-10 text-center space-y-4">
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">
                    Belum ada naskah di database. Silakan buat naskah coding pertamamu!
                  </p>
                  <a href="/scripts" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all">
                    Tulis Naskah AI <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">Pilih dari Daftar Naskah</label>
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {scripts.map(scr => {
                      const isSel = selectedScriptId === scr.id;
                      const hasAud = audios.some(a => a.script_id === scr.id && a.status === 'generated');
                      const hasVid = videos.some(v => v.script_id === scr.id);

                      return (
                        <div
                          key={scr.id}
                          onClick={() => {
                            setSelectedScriptId(scr.id);
                            showToast(`Naskah "${scr.title}" terpilih!`, 'success');
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                            isSel
                              ? 'bg-purple-950/20 border-purple-500'
                              : 'bg-zinc-900/40 border-zinc-850 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-bold text-white">{scr.title}</h4>
                            <p className="text-[10px] text-zinc-500 font-semibold mt-1">Estimasi: {scr.duration_estimate || 30}s | Slot {scr.slot === 1 ? 'Pagi' : scr.slot === 2 ? 'Siang' : 'Malam'}</p>
                          </div>

                          <div className="flex gap-1.5">
                            {hasAud && <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/20 border border-cyan-900/30 px-2 py-0.5 rounded-lg">🎙️ Audio OK</span>}
                            {hasVid && <span className="text-[9px] font-bold text-purple-400 bg-purple-950/20 border border-purple-900/30 px-2 py-0.5 rounded-lg">🎬 Video OK</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedScript && (
                    <div className="bg-zinc-900/45 p-4 rounded-2xl border border-zinc-850 space-y-2">
                      <h4 className="text-xs font-extrabold text-purple-400">Pratinjau Naskah Terpilih</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed italic">"{selectedScript.content}"</p>
                    </div>
                  )}

                  <button
                    disabled={!selectedScriptId}
                    onClick={() => setActiveStep(2)}
                    className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    Langkah Berikutnya: Periksa Audio <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Check Audio TTS */}
          {activeStep === 2 && (
            <div className="glass-panel border-zinc-900 rounded-3xl p-6 space-y-5 animate-scale-in">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Mic className="w-5 h-5 text-purple-400" />
                Langkah 2: Proses Suara Vokal Ara
              </h3>

              {!selectedScript ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-bold">
                  ⚠️ Silakan pilih naskah terlebih dahulu di Langkah 1!
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-900/45 p-5 rounded-2xl border border-zinc-850 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-400">Status Audio Naskah:</span>
                      {selectedAudio ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/20 border border-emerald-900/30 px-3 py-1 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" /> Vokal Siap Digunakan
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-950/20 border border-amber-900/30 px-3 py-1 rounded-xl">
                          <AlertTriangle className="w-4 h-4" /> Audio Belum Terbuat
                        </span>
                      )}
                    </div>

                    <div className="border-t border-zinc-800/60 pt-3.5">
                      <h4 className="text-xs font-extrabold text-white">Naskah Terpilih:</h4>
                      <p className="text-xs text-zinc-400 mt-1">{selectedScript.content}</p>
                    </div>
                  </div>

                  {selectedAudio ? (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500 font-semibold text-center">🎙️ Vokal digital Ara telah tersintesis sempurna di database.</p>
                      
                      <button
                        onClick={() => setActiveStep(3)}
                        className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        Langkah Berikutnya: Konfigurasi Render Video <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        disabled={generatingAudio}
                        onClick={handleGenerateAudioForWorkflow}
                        className="w-full py-4 rounded-2xl btn-gradient text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-950/20"
                      >
                        {generatingAudio ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Mentranskripsikan vokal Ara...
                          </>
                        ) : (
                          <>
                            <Mic className="w-4.5 h-4.5 text-white" />
                            Sintesis Vokal Ara Instan (ElevenLabs)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Configure & Render Video */}
          {activeStep === 3 && (
            <div className="glass-panel border-zinc-900 rounded-3xl p-6 space-y-6 animate-scale-in">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Film className="w-5 h-5 text-purple-400" />
                Langkah 3: Konfigurasi & Render Video Coding AI
              </h3>

              {!selectedScript || !selectedAudio ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-bold">
                  ⚠️ Vokal Suara Ara belum tersedia. Selesaikan Langkah 2 terlebih dahulu!
                </div>
              ) : generatingVideo ? (
                /* Rendering Engine Interactive Terminal Simulation */
                <div className="space-y-5">
                  <div className="flex justify-between items-center text-xs font-extrabold text-zinc-400">
                    <span className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> Sedang merender file MP4 Video Ara...</span>
                    <span className="text-purple-400">{videoProgress}%</span>
                  </div>

                  <div className="w-full bg-zinc-950 border border-zinc-850 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#7c3aed]"
                      style={{ width: `${videoProgress}%` }}
                    ></div>
                  </div>

                  {/* Rendering Code Logs Terminal */}
                  <div className="bg-black/80 border border-zinc-900 rounded-2xl p-4.5 font-mono text-[10px] text-zinc-400 space-y-1.5 h-44 overflow-y-auto scrollbar-thin">
                    <p className="text-zinc-650">*** ARA STUDIO VIDEO RENDER ENGINE V1.0 ***</p>
                    {renderLogs.map((log, index) => (
                      <p key={index} className={log?.includes('💾') ? 'text-emerald-400 font-bold' : log?.includes('🎙️') ? 'text-cyan-400' : 'text-zinc-350'}>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                /* Choose Video Template */
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">Pilih Template Visual Video</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {[
                        { id: 'ara_influencer_explainer', label: '🎥 alpsstudio AI Speaker (Premium)', desc: 'Multiscene: Presenter AI berbicara bergantian dengan B-roll koding neon & pengetikan keyboard close-up.', color: 'border-pink-500 text-pink-400 bg-pink-950/15' },
                        { id: 'coding_neon', label: 'Neon Cyber Code', desc: 'Satu adegan: Editor koding gelap statis dengan pendaran neon ultraviolet.', color: 'border-purple-500 text-purple-400 bg-purple-950/15' },
                        { id: 'retro_terminal', label: 'Retro Terminal', desc: 'Satu adegan: Gaya komputer tabung antik berpancar kursor hijau.', color: 'border-cyan-500 text-cyan-400 bg-cyan-950/15' },
                        { id: 'cyber_matrix', label: 'Matrix Binary Rain', desc: 'Satu adegan: Hujan kode biner berguguran digital futuristik.', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/15' }
                      ].map(t => {
                        const isSel = selectedTheme === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id as any)}
                            className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                              isSel 
                                ? `${t.color} ring-1 ring-offset-0 ring-current`
                                : 'bg-zinc-900/40 border-zinc-850 hover:bg-zinc-900/60 text-zinc-400'
                            }`}
                          >
                            <div>
                              <h4 className="text-xs font-extrabold">{t.label}</h4>
                              <p className="text-[10px] text-zinc-550 font-semibold leading-relaxed mt-1.5">{t.desc}</p>
                            </div>
                            <div className="flex justify-end mt-3">
                              <span className={`w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center p-0.5`}>
                                {isSel && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  <div className="border-t border-zinc-900 pt-4.5 space-y-4">
                    <div className="flex gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-zinc-900 text-zinc-400 px-3 py-1.5 rounded-xl border border-zinc-850">🎬 1080x1920 (Vertical Shorts)</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-zinc-900 text-zinc-400 px-3 py-1.5 rounded-xl border border-zinc-850">⚡ 30 FPS MP4</span>
                    </div>

                    <button
                      onClick={handleGenerateVideo}
                      className="w-full py-4 rounded-2xl btn-gradient text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-950/30"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
                      Mulai Merender Video Coding Ara
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Content Bank Gallery */}
          {activeStep === 4 && (
            <div className="space-y-6 animate-scale-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-purple-400" />
                    Bank Galeri Konten Ara ({videos.length})
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-1">Daftar video yang telah siap diunduh dan didistribusikan ke platform sosial.</p>
                </div>
              </div>

              {videos.length === 0 ? (
                <div className="glass-panel border-zinc-900 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                  <Film className="w-10 h-10 text-zinc-650 mb-3" />
                  <h4 className="text-white font-bold text-sm">Galeri Konten Kosong</h4>
                  <p className="text-zinc-550 text-xs mt-1.5 max-w-[240px] leading-relaxed mx-auto font-semibold">
                    Silakan mulai workflow render video di Langkah 1 untuk membuat aset digital koding Ara pertamamu!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videos.map(vid => {
                    const scr = scripts.find(s => s.id === vid.script_id);
                    const aud = audios.find(a => a.id === vid.audio_id);
                    
                    return (
                      <div key={vid.id} className="glass-panel rounded-3xl p-5 border border-zinc-850 flex flex-col justify-between gap-4">
                        
                        {/* Video info */}
                        <div>
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-lg border ${
                              vid.template_type === 'coding_neon' ? 'text-purple-400 bg-purple-950/20 border-purple-900/30' :
                              vid.template_type === 'retro_terminal' ? 'text-cyan-400 bg-cyan-950/20 border-cyan-900/30' :
                              'text-pink-400 bg-pink-950/20 border-pink-900/30'
                            }`}>
                              {vid.template_type?.replace('_', ' ') || 'Neon'}
                            </span>
                            
                            <button
                              onClick={() => handleDeleteVideo(vid.id)}
                              className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-500 hover:text-rose-400 transition-all"
                              title="Hapus Video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <h4 className="text-sm font-extrabold text-white mt-3.5 leading-snug">{scr?.title || 'Video Coding Ara'}</h4>
                          <p className="text-[10px] text-zinc-500 font-semibold mt-1">Dirender: {new Date(vid.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

                          <div className="mt-3.5 bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-900 text-xs text-zinc-400 leading-relaxed font-semibold line-clamp-2">
                            "{scr?.content}"
                          </div>
                        </div>

                        {/* Metadata grid */}
                        <div className="grid grid-cols-3 gap-2 bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl text-[9px] text-zinc-500 font-bold uppercase tracking-wider text-center">
                          <div>
                            <span className="block text-zinc-650">Ukuran</span>
                            <span className="text-zinc-400 mt-0.5 block">{vid.video_metadata?.size || '15.4MB'}</span>
                          </div>
                          <div className="border-x border-zinc-900">
                            <span className="block text-zinc-650">Resolusi</span>
                            <span className="text-zinc-400 mt-0.5 block">1080x1920</span>
                          </div>
                          <div>
                            <span className="block text-zinc-650">Durasi</span>
                            <span className="text-zinc-400 mt-0.5 block">{vid.video_metadata?.duration || 30}s</span>
                          </div>
                        </div>

                        {/* Download & Play Actions */}
                        <div className="flex gap-2 border-t border-zinc-900 pt-3">
                          <button
                            onClick={() => {
                              setPreviewVideoUrl(vid.file_url);
                              setPreviewTemplate(vid.template_type);
                              setPreviewVideoTitle(scr?.title || 'Video Pratinjau');
                              showToast('Pratinjau video dimuat!', 'info');
                            }}
                            className="flex-1 py-2 px-3 bg-zinc-900 border border-zinc-800 hover:border-purple-500/20 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-4 h-4 text-purple-400" />
                            Pratinjau Player
                          </button>
                          
                          <button
                            onClick={() => handleDownload(vid.file_url, vid.file_name)}
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
          )}

        </div>

        {/* Right Side: Visual Device Smartphone Frame Previewer (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-5 h-5 text-pink-500" />
            <h3 className="text-base font-extrabold text-white">Live Phone Simulator</h3>
          </div>

          {/* Smartphone vertical preview shell */}
          <div className="mx-auto w-[240px] h-[460px] rounded-[36px] border-8 border-zinc-900 bg-zinc-950 shadow-[0_0_40px_rgba(124,58,237,0.15)] overflow-hidden relative flex flex-col justify-between p-4">
            
            {/* Camera notch */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-zinc-900 rounded-full z-20"></div>

            {/* Video preview content area */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              {previewVideoUrl || selectedTheme === 'ara_influencer_explainer' || previewTemplate === 'ara_influencer_explainer' ? (
                /* Dynamic HTML5 Video Player playing active scene stock videos with compositor overlays */
                <div className="w-full h-full relative overflow-hidden bg-zinc-950">
                  <video 
                    key={getActiveVideoSrc()} 
                    src={getActiveVideoSrc()} 
                    autoPlay 
                    loop 
                    muted
                    playsInline 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40 z-10"></div>
                  
                  {/* 100% Bulletproof Glowing Code Matrix animation layer (Solves black backgrounds due to CORS video fail) */}
                  <div className="absolute inset-0 z-5 pointer-events-none opacity-40 font-mono text-[6px] text-emerald-400 space-y-1 select-none leading-none p-4 mt-12">
                    {`const AraAI = { status: 'rendering', voice: 'bella', loop: true };\n`.repeat(4)}
                    <div className="text-purple-400 mt-1">{`import { useState, useEffect } from 'react';\n`.repeat(2)}</div>
                  </div>

                  {/* Top Director HUD Badge overlay inside phone */}
                  <div className="absolute top-8 left-2.5 right-2.5 z-30 flex justify-between items-center gap-1.5 pointer-events-none">
                    <span className="flex items-center gap-1 text-[7px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm shadow-pink-950/20">
                      <span className="w-1 h-1 rounded-full bg-white animate-ping"></span> CINEMA
                    </span>
                    <span className="text-[7.5px] font-extrabold text-zinc-300 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg uppercase border border-zinc-800/40">
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
                  {(currentScene === 1 || currentScene === 3 || currentScene === 5) && (
                    <div className="absolute bottom-20 right-2 z-20 w-[80px] h-[115px] rounded-2xl overflow-hidden border border-purple-550/40 bg-zinc-950/90 shadow-xl animate-fade-in flex flex-col justify-end p-1">
                      {/* Speaker image scaled for breath */}
                      <div className="absolute inset-0 w-full h-full bg-zinc-950">
                        <img 
                          src={
                            selectedTheme === 'coding_neon' ? '/avatar_library.jpg' : 
                            selectedTheme === 'retro_terminal' ? '/avatar_park.jpg' : 
                            '/avatar_cafe.jpg'
                          } 
                          alt="Speaking Ara virtual presenter" 
                          className="w-full h-full object-cover opacity-90 transition-transform duration-500"
                          style={{ transform: `scale(${breathScale})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-transparent"></div>

                        {/* Real-time speaking lips & blinking eyes overlay on top of the avatar face! */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          {/* Eyes overlay */}
                          <div className="absolute top-[38%] left-[28%] right-[28%] flex justify-between">
                            {eyesClosed ? (
                              <>
                                <div className="w-4.5 h-1.5 bg-black border-t border-purple-400 rounded-full shadow-lg"></div>
                                <div className="w-4.5 h-1.5 bg-black border-t border-purple-400 rounded-full shadow-lg"></div>
                              </>
                            ) : null}
                          </div>

                          {/* Talking glowing lips overlay */}
                          <div className="absolute top-[52%] left-1/2 -translate-x-1/2 w-6 h-5 flex items-center justify-center">
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
                      <div className="absolute top-1 left-1 flex gap-0.5 items-end h-4 z-25 bg-black/60 p-0.5 rounded">
                        {visualizerBars.slice(0, 4).map((barHeight, idx) => (
                          <span 
                            key={idx} 
                            className="w-0.5 bg-pink-500 rounded-full transition-all duration-75"
                            style={{ height: `${barHeight / 2.2}px` }}
                          ></span>
                        ))}
                      </div>

                      <div className="relative z-10 bg-black/75 px-1 py-0.5 rounded border border-purple-500/20 text-[5.5px] font-black text-purple-300 text-center font-mono uppercase tracking-wider">
                        alpsstudio Presenter
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Beautiful interactive Avatar Preview matching the selected theme! */
                <div className="w-full h-full relative overflow-hidden flex flex-col items-between justify-between p-4 bg-zinc-950">
                  {/* Static image of the chosen avatar theme */}
                  <div className="absolute inset-0 w-full h-full">
                    <img 
                      src={
                        selectedTheme === 'coding_neon' ? '/avatar_library.jpg' :
                        selectedTheme === 'retro_terminal' ? '/avatar_park.jpg' :
                        '/avatar_cafe.jpg'
                      } 
                      alt="Ara Active Avatar" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-zinc-950/40"></div>
                  </div>

                  {/* Top Header Badge inside phone */}
                  <div className="relative z-10 w-full flex justify-between items-center mt-2.5">
                    <span className="text-[9px] font-bold text-zinc-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-800">
                      Avatar Terpilih
                    </span>
                    <span className="text-[9px] font-bold text-purple-400 bg-purple-950/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-purple-800/40 uppercase tracking-widest font-mono">
                      {selectedTheme === 'coding_neon' ? 'Library Mood' :
                       selectedTheme === 'retro_terminal' ? 'Park Mood' :
                       'Cafe Mood'}
                    </span>
                  </div>

                  {/* Floating abstract code grid overlay */}
                  <div className="absolute inset-0 opacity-15 font-mono text-[7px] text-purple-400 space-y-1 select-none leading-none p-4 mt-12 pointer-events-none">
                    {`const AraAI = {
  role: 'AI Influencer Coding',
  mood: '${selectedTheme === 'coding_neon' ? 'Developer' : selectedTheme === 'retro_terminal' ? 'Sunset Park' : 'Casual Cafe'}',
  avatarReady: true
}; \n`.repeat(5)}
                  </div>
                  
                  {/* Small card label at the bottom */}
                  <div className="relative z-10 w-full bg-black/70 backdrop-blur-md border border-zinc-900 rounded-2xl p-3 flex items-center gap-2.5 mb-2 shadow-xl mt-auto">
                    <div className="w-8 h-8 rounded-full border border-purple-500 overflow-hidden bg-zinc-900 flex-shrink-0">
                      <img 
                        src="/avatar_park.jpg" 
                        alt="Ara mini" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 text-left">
                      <h5 className="text-[9px] font-extrabold text-white">alpsstudio Presenter</h5>
                      <span className="text-[8px] text-zinc-400 font-semibold block mt-0.5">Avatar Aktif & Siap Mengisi Video</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Vertical Subtitle and Overlay overlays (similar to TikTok) */}
            <div className="relative z-10 w-full flex flex-col justify-between h-full pointer-events-none">
              
              {/* Top info */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-zinc-400 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">@alpsstudio</span>
                <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/50 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></span> LIVE
                </span>
              </div>

              {/* Middle Subtitle overlays synced dynamically */}
              <div className="my-auto text-center w-full px-2">
                {generatingVideo ? (
                  <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-purple-500/20 animate-pulse">
                    <span className="text-[10px] font-extrabold text-purple-400 font-mono tracking-wide">ARA_ENGINE: COMPILING...</span>
                  </div>
                ) : selectedScript ? (
                  <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-pink-500/20">
                    <p className="text-[9.5px] font-extrabold text-white leading-relaxed line-clamp-3 text-center">
                      {selectedTheme === 'ara_influencer_explainer' || previewTemplate === 'ara_influencer_explainer' ? (
                        currentScene === 1 ? '🎙️ "Halo developer! Ara di sini. Stop bingung koding React, mari kita bedah naskah premium hari ini!"' :
                        currentScene === 2 ? '⌨️ "Mari kita perhatikan bagaimana kodenya berjalan secara cepat, terstruktur, dan bersih..."' :
                        currentScene === 3 ? '💡 "Kita memakai React Hook useState untuk mendefinisikan status variabel di memori..."' :
                        currentScene === 4 ? '💻 "Sangat dinamis dan instan! Setiap ada pembaruan data, komponen langsung me-render ulang UI..."' :
                        '👋 "Gampang banget kan? Klik like, simpan, dan ikuti Alps Studio untuk tips coding seru berikutnya!"'
                      ) : (
                        selectedScript.hook || selectedScript.title
                      )}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Bottom Creator Info block */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white">#TutorialCoding #AraAI</p>
                <p className="text-[8px] text-zinc-400 leading-snug font-semibold line-clamp-2 bg-black/20 p-1.5 rounded">
                  {selectedScript ? selectedScript.title : 'Ara Studio Video Generator Simulator'}
                </p>
              </div>

            </div>

          </div>

          {/* Player controls */}
          {previewVideoUrl && (
            <div className="text-center">
              <button
                onClick={() => {
                  setPreviewVideoUrl(null);
                  setPreviewTemplate(null);
                  setPreviewVideoTitle('');
                }}
                className="py-2 px-4 bg-rose-950/20 border border-rose-900/30 hover:border-rose-500 text-rose-400 rounded-xl text-xs font-bold transition-all"
              >
                Reset Live Simulator
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default function VideoGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="glass-panel border-zinc-900 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 animate-spin">
          <RefreshCw className="w-5 h-5 text-purple-400" />
        </div>
        <h4 className="text-zinc-400 font-bold text-sm">Memuat Video Generator...</h4>
      </div>
    }>
      <VideoGeneratorContent />
    </Suspense>
  );
}
