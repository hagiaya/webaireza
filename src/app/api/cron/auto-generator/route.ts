import { NextResponse } from 'next/server';
import { supabase, isMockDb } from '@/lib/supabase';

// Helper function to split text into chunks under maximum length without cutting words
function splitTextIntoChunks(text: string, maxLength: number = 170): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).trim().length <= maxLength) {
      currentChunk = (currentChunk + ' ' + word).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = word;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

// High-fidelity pre-crafted AI content databases matching the 3 requested themes
const CONTENT_CREATIVE_DATABASE = {
  // Theme 1: Developer Content Creator (tips, lifestyle, branding)
  developer_creator: [
    {
      title: 'Trik Jadi Developer Creator Sukses',
      category: 'tips',
      content: 'Woi Developer! Capek cuma ngoding 9-to-5 dan pengen jadi Content Creator sukses buat bangun personal branding? Sini Ara bisikin rahasianya! Pertama, jangan bahas teori membosankan. Bahas real-world problem atau developer lifestyle yang super relateable! Kedua, pakai visual video berpendar neon yang estetis biar mata audiens langsung nempel. Ketiga, konsisten posting 3 kali sehari pakai autopilot Ara Studio! Mau tips koding dan branding pro lainnya? Follow Ara sekarang juga!',
      hook: 'Woi Developer! Capek cuma ngoding 9-to-5 dan pengen jadi Content Creator sukses?',
      cta: 'Mau tips koding dan branding pro lainnya? Follow Ara sekarang juga!',
      template_type: 'coding_neon',
      duration: 30
    },
    {
      title: 'Bongkar Rahasia Koding Cepat 2026',
      category: 'javascript',
      content: 'Guys! Developer pro itu gak cuma nulis kode lebih banyak, tapi nulis kode lebih cerdas! Ini 3 trik rahasia biar kodingan kamu secepat kilat. Pertama, kuasai keyboard shortcut editor kamu secara penuh. Bye-bye mouse! Kedua, biasakan buat reusable hooks atau utility functions biar gak nulis kode berulang. Ketiga, manfaatkan snippets dan AI assistant Ara untuk autocomplete cerdas. Komen di bawah shortcut favorit kamu dan jangan lupa follow Ara!',
      hook: 'Developer pro itu gak cuma nulis kode lebih banyak, tapi nulis kode lebih cerdas!',
      cta: 'Komen di bawah shortcut favorit kamu dan jangan lupa follow Ara!',
      template_type: 'retro_terminal',
      duration: 35
    }
  ],
  // Theme 2: Company Website Development Services (landing pages, corporate profiles)
  company_website: [
    {
      title: 'Landing Page Kustom vs Template',
      category: 'react',
      content: 'Bos Perusahaan Merapat! Perusahaan skala besar kok website profilnya masih pakai template gratisan yang lemot dan kurang profesional? Hati-hati kehilangan calon klien kak! Landing page custom premium itu laksana marketing 24 jam non-stop. Teroptimasi SEO Google, super responsive di HP, dan loading sangat cepat di bawah 1 detik! Tim developer Ara siap mendevelop website corporate kelas dunia dengan teknologi modern Next.js. Klik link di bio buat konsultasi gratis!',
      hook: 'Perusahaan skala besar kok website profilnya masih pakai template gratisan yang lemot?',
      cta: 'Tim developer Ara siap mendevelop website corporate kelas dunia. Klik link di bio buat konsultasi gratis!',
      template_type: 'coding_neon',
      duration: 40
    },
    {
      title: '3 Penyebab Website Bisnismu Sepi Klien',
      category: 'tips',
      content: 'Teman-teman pebisnis, tahu gak kenapa website perusahaan kamu sepi pengunjung dan gak menghasilkan konversi penjualan? Ini dia 3 biang keroknya! Pertama, loadingnya lambat banget karena pakai hosting murah. Pengunjung keburu kabur! Kedua, tombol ajakan bertindak atau CTA-nya gak jelas. Ketiga, desainnya jadul dan gak meyakinkan. Solusinya? Upgrade ke website kustom premium rancangan tim developer Ara. Klik link di bio sekarang juga!',
      hook: 'Tahu gak kenapa website perusahaan kamu sepi pengunjung dan gak menghasilkan konversi penjualan?',
      cta: 'Solusinya? Upgrade ke website kustom premium rancangan tim developer Ara. Klik link di bio sekarang!',
      template_type: 'cyber_matrix',
      duration: 30
    }
  ],
  // Theme 3: Custom Enterprise Apps (ERP, CRM, large scale business systems)
  enterprise_apps: [
    {
      title: 'Ucapkan Bye-Bye Google Sheets untuk ERP',
      category: 'database',
      content: 'Kerja di perusahaan besar tapi kelola inventory gudang dan keuangan masih pakai spreadsheet Google Sheets manual? Duh, rawan terhapus dan bocor kak! Sudah saatnya perusahaanmu migrasi ke custom Enterprise App. ERP, CRM, dan sistem manajemen kustom terintegrasi penuh, aman terenkripsi, dan sesuai alur bisnis internal perusahaanmu. Tim developer Ara siap rancang sistem backend tangguh skala besar buat naikin efisiensi 300%. Hubungi kami di link bio!',
      hook: 'Kerja di perusahaan besar tapi kelola gudang masih pakai spreadsheet manual? Duh, bahaya banget!',
      cta: 'Tim developer Ara siap rancang sistem backend tangguh skala besar. Hubungi kami di link bio!',
      template_type: 'cyber_matrix',
      duration: 45
    },
    {
      title: 'Kenapa Aplikasi Custom Lebih Efisien',
      category: 'react',
      content: 'Banyak direktur perusahaan bingung, mending beli software jadi atau bikin aplikasi custom ya? Ini jawabannya! Software jadi itu kaku, bisnis kamu dipaksa ikut cara kerja software. Tapi kalau Aplikasi Custom buatan Ara Studio, sistemnya yang didesain 100% mengikuti SOP perusahaanmu! Lebih aman, modular, tanpa biaya langganan bulanan per pengguna, dan mudah dikembangkan di masa depan. Yuk konsultasikan sistem perusahaanmu di link bio!',
      hook: 'Mending beli software jadi atau bikin aplikasi kustom ya untuk perusahaan?',
      cta: 'Yuk konsultasikan sistem perusahaanmu bersama developer pro Ara Studio di link bio!',
      template_type: 'retro_terminal',
      duration: 40
    }
  ]
};

export async function POST() {
  try {
    // 1. Determine target date (We look at today first. If today already has scheduled items, look at tomorrow)
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: existingCal } = await supabase.from('content_calendar').select('*');
    const safeCal = existingCal || [];
    
    // Find the next date that doesn't have 3 scheduled slots
    let targetDate = todayStr;
    let attempts = 0;
    
    while (attempts < 15) {
      const daySlots = safeCal.filter((c: any) => c.scheduled_date === targetDate);
      if (daySlots.length < 3) {
        break; // found an open date!
      }
      // Increment date by 1 day
      const d = new Date(targetDate);
      d.setDate(d.getDate() + 1);
      targetDate = d.toISOString().split('T')[0];
      attempts++;
    }

    const scheduledToday = safeCal.filter((c: any) => c.scheduled_date === targetDate);
    const createdLogs: string[] = [];
    const automationSummary = [];
    const scriptsInserted: any[] = [];
    const audiosInserted: any[] = [];
    const videosInserted: any[] = [];
    const calendarInserted: any[] = [];

    // Helper for slots timings
    const slotTimes = {
      1: '07:00:00',
      2: '12:00:00',
      3: '19:00:00'
    };

    // 2. We generate for the 3 slots matching the 3 themes
    const slotsToGenerate = [
      { slot: 1, theme: 'developer_creator', name: 'Slot Pagi (Creator Tips)' },
      { slot: 2, theme: 'company_website', name: 'Slot Siang (Corporate Web)' },
      { slot: 3, theme: 'enterprise_apps', name: 'Slot Malam (Enterprise App)' }
    ];

    const videoTemplates = {
      coding_neon: 'https://assets.mixkit.co/videos/preview/mixkit-coding-on-a-computer-screen-close-up-34282-large.mp4',
      retro_terminal: 'https://assets.mixkit.co/videos/preview/mixkit-hand-typing-on-a-glowing-computer-keyboard-close-up-34283-large.mp4',
      cyber_matrix: 'https://assets.mixkit.co/videos/preview/mixkit-stream-of-green-matrix-style-code-numbers-42864-large.mp4'
    };

    for (const item of slotsToGenerate) {
      // Check if slot is already occupied for this targetDate
      const slotTime = slotTimes[item.slot as 1 | 2 | 3];
      const isOccupied = scheduledToday.some((c: any) => c.scheduled_time?.startsWith(slotTime.substring(0, 3)));
      if (isOccupied) {
        createdLogs.push(`⚠️ ${item.name} pada ${targetDate} sudah terisi. Melewati.`);
        continue;
      }

      // Pick a random creative from the corresponding database category
      const pool = CONTENT_CREATIVE_DATABASE[item.theme as keyof typeof CONTENT_CREATIVE_DATABASE];
      const randomCreative = pool[Math.floor(Math.random() * pool.length)];

      const uniqueSuffix = Math.random().toString(36).substring(2, 6);

      // PIPELINE STEP 1: Auto-generate and Save Script
      const scriptEntry = {
        title: `${randomCreative.title} #${uniqueSuffix.toUpperCase()}`,
        content: randomCreative.content,
        hook: randomCreative.hook,
        cta: randomCreative.cta,
        duration_estimate: randomCreative.duration,
        category: randomCreative.category,
        slot: item.slot,
        status: 'ready' // Set to ready since we generate audio next
      };

      const { data: insScript, error: scriptErr } = await supabase.from('scripts').insert(scriptEntry).select();
      if (scriptErr) throw new Error(`Script insert error: ${scriptErr.message}`);
      
      const scriptRow = insScript && insScript.length > 0 ? insScript[0] : { id: `mock-s-${uniqueSuffix}`, ...scriptEntry };
      scriptsInserted.push(scriptRow);
      
      // Get inserted script ID (mock DB returns it directly, real DB needs extraction)
      const scriptId = scriptRow.id;

      // PIPELINE STEP 2: Auto-generate Speech TTS Audio strictly using ElevenLabs (Bella)
      const audioFileName = `ara_autopilot_${item.slot}_${targetDate.replace(/-/g, '')}_${uniqueSuffix}.mp3`;
      let finalAudioUrl = '';

      if (isMockDb) {
        finalAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      } else {
        const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
        if (!elevenlabsApiKey || elevenlabsApiKey === 'your_elevenlabs_api_key') {
          throw new Error('ElevenLabs API Key belum dikonfigurasi di file .env.local');
        }

        const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella (ElevenLabs - Free Plan compatible)
        const elevenlabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        
        const response = await fetch(elevenlabsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elevenlabsApiKey
          },
          body: JSON.stringify({
            text: randomCreative.content,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true
            }
          })
        });

        if (!response.ok) {
          const errMsg = await response.text();
          throw new Error(`ElevenLabs synthesis failed: ${errMsg}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const combinedBuffer = Buffer.from(arrayBuffer);

        // Upload combined buffer to Supabase Storage
        const { error: uploadErr } = await supabase.storage
          .from('audios')
          .upload(audioFileName, combinedBuffer, {
            contentType: 'audio/mpeg',
            upsert: true
          });

        if (uploadErr) {
          throw new Error(`Gagal mengunggah vokal autopilot ke Storage: ${uploadErr.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('audios')
          .getPublicUrl(audioFileName);
        finalAudioUrl = publicUrlData?.publicUrl || '';
      }

      const audioEntry = {
        script_id: scriptId,
        file_url: finalAudioUrl,
        file_name: audioFileName,
        voice: 'EXAVITQu4vr4xnSDxMaL', // Bella (ElevenLabs - Free Plan compatible)
        duration: randomCreative.duration,
        status: 'generated'
      };

      const { data: insAudio, error: audioErr } = await supabase.from('audios').insert(audioEntry).select();
      if (audioErr) throw new Error(`Audio insert error: ${audioErr.message}`);
      const audioRow = insAudio && insAudio.length > 0 ? insAudio[0] : { id: `mock-a-${uniqueSuffix}`, ...audioEntry };
      audiosInserted.push(audioRow);
      const audioId = audioRow.id;

      // PIPELINE STEP 3: Auto-render dynamic Coding Video
      const videoEntry = {
        script_id: scriptId,
        audio_id: audioId,
        file_url: videoTemplates[randomCreative.template_type as keyof typeof videoTemplates] || videoTemplates.coding_neon,
        file_name: `ara_autopilot_render_${uniqueSuffix}.mp4`,
        template_type: randomCreative.template_type,
        video_metadata: {
          size: randomCreative.template_type === 'cyber_matrix' ? '18.1MB' : '15.2MB',
          resolution: '1080x1920 (Vertical)',
          duration: randomCreative.duration
        }
      };

      const { data: insVideo, error: videoErr } = await supabase.from('videos').insert(videoEntry).select();
      if (videoErr) throw new Error(`Video insert error: ${videoErr.message}`);
      const videoRow = insVideo && insVideo.length > 0 ? insVideo[0] : { id: `mock-v-${uniqueSuffix}`, ...videoEntry };
      videosInserted.push(videoRow);
      const videoId = videoRow.id;

      // PIPELINE STEP 4: Auto-schedule in Content Calendar
      const captionText = `${randomCreative.title}! 🚀✨ ${randomCreative.hook} #coding #developer #jasapembuatanwebsite #enterpriseapp #arastudio`;
      const calendarEntry = {
        audio_id: audioId,
        script_id: scriptId,
        scheduled_date: targetDate,
        scheduled_time: slotTime,
        platform: 'tiktok,instagram,youtube',
        caption: captionText,
        hashtags: '#coding #developer #jasapembuatanwebsite #enterpriseapp #arastudio #influencerai',
        status: 'scheduled'
      };

      const { data: insCal } = await supabase.from('content_calendar').insert(calendarEntry).select();
      const calRow = insCal && insCal.length > 0 ? insCal[0] : { id: `mock-c-${uniqueSuffix}`, ...calendarEntry };
      calendarInserted.push(calRow);
      
      // Update script status to 'used' as it's active in calendar
      await supabase.from('scripts').update({ status: 'used' }).eq('id', scriptId);

      createdLogs.push(`✅ Berhasil mengotomatisasi ${item.name} untuk tanggal ${targetDate}!`);
      automationSummary.push({
        slot: item.slot,
        theme: item.theme,
        title: randomCreative.title,
        template: randomCreative.template_type
      });
    }

    return NextResponse.json({
      success: true,
      autopilot: true,
      target_date: targetDate,
      message: `Autopilot Ara Studio sukses dijalankan untuk tanggal ${targetDate}!`,
      logs: createdLogs,
      summary: automationSummary,
      scripts: scriptsInserted,
      audios: audiosInserted,
      videos: videosInserted,
      calendar: calendarInserted
    });

  } catch (error: any) {
    console.error('Error running 24h cron autopilot:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
