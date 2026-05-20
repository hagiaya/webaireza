import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// High-fidelity fallback generator in case Claude API is not configured
function generateAraFallbackScript(topic: string, category: string, duration: number, slot: number) {
  const normCat = category.toLowerCase();
  
  let title = `Tips Jago ${category.toUpperCase()}`;
  let hook = '';
  let content = '';
  let cta = '';
  
  if (normCat === 'css') {
    title = `Rahasia CSS: ${topic || 'Centering Div'}`;
    hook = `Woi anak IT! Masih pusing mikirin cara ${topic || 'centering div di CSS'}? Sini, Ara punya trik rahasia 10 detik! 💻✨`;
    content = `Dengerin ya! Daripada kamu ngasal pakai margin auto terus malah berantakan, cara paling mantap itu pakai CSS Flexbox! Cukup tambahin display flex, terus set justify-content center sama align-items center di parent element-nya. Boom! Elemen kamu langsung nengah sempurna secara horizontal dan vertical. Gampang banget kan? Gak perlu nangis di pojokan lagi!`;
    cta = `Coba sekarang juga di workspace kamu! Terus tulisin di kolom komentar, tips CSS apa lagi yang pengen Ara bahas? Jangan lupa follow Ara biar skill ngoding kamu makin naik level! 🚀💖`;
  } else if (normCat === 'javascript' || normCat === 'js') {
    title = `Trik Cepat JavaScript: ${topic || 'Optional Chaining'}`;
    hook = `Guys, kodingan JavaScript kamu sering crash gara-gara error "undefined"? 😱 Sini merapat, Ara kasih paham fitur penyelamat hidup!`;
    content = `Triknya adalah pakai Optional Chaining! Cukup selipin tanda tanya titik sebelum manggil properti yang kamu gak yakin ada. Jadi, daripada nulis if-statement panjang lebar yang bikin pusing, kamu tinggal tulis user?.profile?.name. Kalau datanya gak ada, dia bakal return undefined dengan elegan tanpa bikin aplikasi kamu mati mendadak. Bener-bener game-changer banget kan?!`;
    cta = `Mantap kan? Buruan share video ini ke temen kamu yang kodingannya masih sering crash, dan follow Ara untuk tips koding modern lainnya! ⚡️🔥`;
  } else if (normCat === 'react') {
    title = `React Hooks: ${topic || 'useState vs useEffect'}`;
    hook = `React developer pemula, stop bingung! ⚛️ Aku mau jelasin bedanya useState dan useEffect dalam 30 detik aja. Simak baik-baik!`;
    content = `Jadi gini, useState itu ibarat memori jangka pendek dari komponen kamu. Dipakai buat nyimpen data yang kalau diubah, tampilan webnya bakal langsung ke-update otomatis. Nah, kalau useEffect itu kayak detektif rahasia. Tugasnya mantau data tertentu. Begitu datanya berubah, dia bakal otomatis jalanin perintah luar, kayak fetch data dari server. Paham kan bedanya?`;
    cta = `Bikin ketagihan ngoding kan? Share postingan ini ke grup pemrograman kamu, dan jangan lupa follow Ara ya! 😉✨`;
  } else if (normCat === 'python') {
    title = `Python Super Cepat: ${topic || 'List Comprehension'}`;
    hook = `Pecinta Python, merapat! 🐍 Capek gak sih nulis for-loop sampai 5 baris cuma buat filter list? Ini dia trik satu baris dari Ara!`;
    content = `Jawabannya pakai List Comprehension! Kamu bisa gabungin for-loop dan if-statement langsung di dalam bracket siku. Contohnya: angka_genap sama dengan bracket x for x in range sepuluh if x modulo dua sama dengan nol. Kodenya langsung super clean, ringkas, dan performanya jauh lebih kencang! Ini nih rahasia programmer senior nulis python!`;
    cta = `Gampang banget kan?! Tulis di kolom komentar kalau kamu pengen dibikinin cheat-sheet Python gratis dari aku, dan follow Ara terus ya! ✌️💻`;
  } else {
    // Default fallback
    title = topic ? `Belajar ${topic}` : `Tips Coding Keren`;
    hook = `Anak IT mana suaranya? 📣 Pengen tahu cara asyik paham ${topic || 'kodingan fundamental'}? Ara punya tips rahasia buat kamu!`;
    content = `Kuncinya itu konsistensi dan praktek langsung! Jangan cuma dihafal sintaksnya, tapi coba bikin mini project sendiri dari apa yang baru kamu pelajari tentang ${topic || 'topik ini'}. Pecah masalah besar jadi bagian-bagian kecil biar gak gampang stress. Begitu eror, baca error-log nya pelan-pelan. Ngoding itu seru kok kalau kita tahu celahnya!`;
    cta = `Semangat ya belajarnya! Share video ini ke temen seperjuangan kamu, dan follow Ara buat terus update tutorial coding seru lainnya! 🚀💻`;
  }

  const durationEstimate = duration || 30;
  
  return {
    title,
    content: `${hook}\n\n${content}\n\n${cta}`,
    hook,
    cta,
    duration_estimate: durationEstimate,
    slot,
    status: 'draft',
    category: category || 'javascript',
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, duration, slot, category } = body;

    if (!topic) {
      return NextResponse.json({ success: false, message: 'Topik wajib diisi' }, { status: 400 });
    }

    // 1. Check if we have an Anthropic API Key (from env or db config settings)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let generatedScript: any = null;

    if (anthropicKey && !anthropicKey.includes('YOUR_') && anthropicKey !== '') {
      try {
        const prompt = `Kamu adalah Ara, AI influencer perempuan ceria dan energik yang mengajarkan coding kepada pemula Indonesia.
Buat script video ${duration || 30} detik tentang ${topic} (Kategori: ${category || 'coding'}) dengan:
- Hook: kalimat pembuka mengejutkan/menarik dalam bahasa Indonesia gaul
- Isi: penjelasan singkat dan mudah dipahami
- CTA: ajakan follow/komen yang engaging
Format: natural, ceria, pakai kata 'aku' dan 'kamu', sesekali pakai emoji. Maksimal ${((duration || 30) * 15)} karakter.

Tolong kembalikan respons dalam format JSON mentah (jangan dibungkus markdown \`\`\`json) dengan struktur berikut:
{
  "title": "judul singkat menarik",
  "hook": "kalimat pembuka viral",
  "content": "isi lengkap naskah video termasuk hook dan cta",
  "cta": "kalimat penutup cta"
}`;

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        const data = await res.json();
        const contentText = data.content[0].text;
        
        // Parse JSON output
        try {
          const parsed = JSON.parse(contentText.trim());
          generatedScript = {
            title: parsed.title,
            content: parsed.content,
            hook: parsed.hook,
            cta: parsed.cta,
            duration_estimate: duration || 30,
            slot: slot || 1,
            status: 'draft',
            category: category || 'javascript'
          };
        } catch (pe) {
          // JSON parsing failed, create manual parsing or fallback
          console.warn('JSON parsing of AI output failed, using regex extraction or fallback');
          generatedScript = generateAraFallbackScript(topic, category, duration, slot);
        }
      } catch (apiErr) {
        console.error('Claude API call failed, falling back to beautiful template generator:', apiErr);
        generatedScript = generateAraFallbackScript(topic, category, duration, slot);
      }
    } else {
      // API Key not present, use the beautiful custom template generator
      generatedScript = generateAraFallbackScript(topic, category, duration, slot);
    }

    // 2. Save script into Supabase database (real or mock)
    const { data: dbData, error: dbErr } = await supabase
      .from('scripts')
      .insert(generatedScript)
      .select();

    if (dbErr) {
      console.error('Database save script error:', dbErr);
      return NextResponse.json({ success: false, message: dbErr.message }, { status: 500 });
    }

    // Since insert returns the row in many Supabase configurations (or mock)
    // We can query the latest script or return the object directly
    const returnedScript = dbData && dbData.length > 0 ? dbData[0] : { id: 'temp-' + Math.random().toString(36).substring(2,7), ...generatedScript };

    return NextResponse.json({
      success: true,
      script: returnedScript,
      message: 'Script berhasil digenerate dan disimpan ke database.'
    });

  } catch (error: any) {
    console.error('Error generating script route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
