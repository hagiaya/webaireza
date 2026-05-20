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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { audio_id, script_id, date, time, platforms } = body; // platforms is an array e.g. ['tiktok', 'instagram', 'youtube']

    if (!script_id || !date || !time || !platforms || platforms.length === 0) {
      return NextResponse.json({ success: false, message: 'Data penjadwalan tidak lengkap' }, { status: 400 });
    }

    // 1. Fetch script to check category and title
    const { data: script, error: scrErr } = await supabase.from('scripts').select('*').eq('id', script_id).single();
    if (scrErr || !script) {
      return NextResponse.json({ success: false, message: 'Script tidak ditemukan' }, { status: 404 });
    }

    const { caption, hashtags } = generateCaptionAndHashtags(script.title, script.category);

    // 2. Format platforms as a comma-separated string
    const platformString = platforms.join(',');

    // 3. Create entry
    const newEntry = {
      audio_id: audio_id || null,
      script_id: script_id,
      scheduled_date: date,
      scheduled_time: time,
      platform: platformString,
      caption,
      hashtags,
      status: 'scheduled'
    };

    const { data: dbData, error: dbErr } = await supabase.from('content_calendar').insert(newEntry);
    
    if (dbErr) {
      console.error('Error inserting into content_calendar:', dbErr);
      return NextResponse.json({ success: false, message: dbErr.message }, { status: 500 });
    }

    // 4. Update script status to 'used'
    await supabase.from('scripts').update({ status: 'used' }).eq('id', script_id);

    const savedEntry = dbData && dbData.length > 0 ? dbData[0] : { id: 'temp-cal-' + Math.random().toString(36).substring(2,7), ...newEntry };

    return NextResponse.json({
      success: true,
      entry: savedEntry,
      message: 'Konten berhasil dijadwalkan!'
    });

  } catch (error: any) {
    console.error('Error scheduling content route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
