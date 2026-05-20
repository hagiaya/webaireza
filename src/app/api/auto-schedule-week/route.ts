import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to generate social media caption & hashtags based on category and title
function generateCaptionAndHashtags(title: string, category: string) {
  const normCat = category?.toLowerCase() || 'coding';
  let caption = '';
  let hashtags = '';

  if (normCat === 'css') {
    caption = `Siapa nih yang kodingan CSS nya masih sering berantakan? 😭 Ara punya tips mantap buat kamu tentang "${title}". Tonton sampai habis ya! 😎🔥 #css #webdev #programmer #indonesia`;
    hashtags = '#css #webdev #programmer #indonesia #coding #ara';
  } else if (normCat === 'javascript' || normCat === 'js') {
    caption = `Developer modern wajib tahu fitur JavaScript keren ini! ⚡️💻 Bikin kodingan makin sat-set dan anti-crash. Cobain yuk! #javascript #js #programming #belajarcoding`;
    hashtags = '#javascript #js #programming #belajarcoding #developer #ara';
  } else if (normCat === 'react') {
    caption = `React tips spesial buat kamu! ⚛️ Belajar "${title}" cuma dalam 30 detik. Jangan dibikin pusing, tonton cara serunya bareng Ara! #reactjs #nextjs #coding #programmer`;
    hashtags = '#reactjs #nextjs #coding #programmer #webdev #ara';
  } else if (normCat === 'python') {
    caption = `Ular Python anti ribet! 🐍💻 Cobain trik coding ringkas ini biar kodingan Python kamu makin clean dan kelihatan pro. #python #programming #codingindonesia`;
    hashtags = '#python #programming #codingindonesia #programmer #ara';
  } else {
    caption = `Belajar coding seru dan asyik bareng Ara! 🚀✨ Kali ini aku bahas tentang "${title}". Komen di bawah kalau kamu ada pertanyaan ya! #coding #belajarkoding #developer`;
    hashtags = '#coding #belajarkoding #developer #programmer #indonesia #ara';
  }

  return { caption, hashtags };
}

export async function POST() {
  try {
    // 1. Fetch scripts that are 'ready'
    const { data: scripts, error: scrErr } = await supabase.from('scripts').select('*').eq('status', 'ready');
    const { data: audios } = await supabase.from('audios').select('*').eq('status', 'generated');
    const { data: existingCal } = await supabase.from('content_calendar').select('*');

    if (scrErr) {
      return NextResponse.json({ success: false, message: scrErr.message }, { status: 550 });
    }

    const readyScripts = scripts || [];
    const generatedAudios = audios || [];
    const calendarData = existingCal || [];

    if (readyScripts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tidak ada naskah berstatus "ready" di database. Silakan buat naskah dan generate audio terlebih dahulu!' 
      });
    }

    const scheduledEntries = [];
    const scriptsToUse = [...readyScripts];

    // Helper for time mappings per slot
    const slotTimes = {
      1: '07:00:00',
      2: '12:00:00',
      3: '19:00:00'
    };

    // 2. Loop for the next 7 days starting tomorrow
    for (let i = 1; i <= 7; i++) {
      if (scriptsToUse.length === 0) break;

      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + i);
      const dateStr = dateObj.toISOString().split('T')[0];

      // We have 3 slots per day (slot 1, slot 2, slot 3)
      for (const slotNum of [1, 2, 3]) {
        if (scriptsToUse.length === 0) break;

        // Check if there is already a scheduled item for this date and slot
        const isAlreadyScheduled = calendarData.some((c: any) => {
          if (c.scheduled_date !== dateStr) return false;
          // Find script of calendar to check its slot preference
          const scr = scriptsToUse.find(s => s.id === c.script_id);
          return scr?.slot === slotNum || c.scheduled_time?.startsWith(slotNum === 1 ? '07:' : slotNum === 2 ? '12:' : '19:');
        });

        if (isAlreadyScheduled) continue;

        // Find a script preferred for this slot, or take the first available
        const preferredScriptIndex = scriptsToUse.findIndex(s => s.slot === slotNum);
        const scriptIndex = preferredScriptIndex !== -1 ? preferredScriptIndex : 0;
        
        // Extract script
        const script = scriptsToUse.splice(scriptIndex, 1)[0];
        
        // Find corresponding audio file if generated
        const audio = generatedAudios.find((a: any) => a.script_id === script.id);

        const { caption, hashtags } = generateCaptionAndHashtags(script.title, script.category);
        const slotTime = slotTimes[slotNum as 1 | 2 | 3];

        const calendarEntry = {
          audio_id: audio ? audio.id : null,
          script_id: script.id,
          scheduled_date: dateStr,
          scheduled_time: slotTime,
          platform: 'tiktok,instagram,youtube', // Default scheduled to all 3 platforms
          caption,
          hashtags,
          status: 'scheduled'
        };

        // Insert schedule entry
        const { data: insData } = await supabase.from('content_calendar').insert(calendarEntry);
        
        // Update script status to 'used'
        await supabase.from('scripts').update({ status: 'used' }).eq('id', script.id);

        scheduledEntries.push({
          ...calendarEntry,
          id: insData && insData.length > 0 ? insData[0].id : `auto-cal-${Math.random().toString(36).substring(2,7)}`,
          script_title: script.title
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: scheduledEntries.length,
      entries: scheduledEntries,
      message: `Berhasil menjadwalkan otomatis ${scheduledEntries.length} konten untuk 7 hari ke depan!`
    });

  } catch (error: any) {
    console.error('Error auto-scheduling week route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
