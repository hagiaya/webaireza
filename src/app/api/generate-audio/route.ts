import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

// Helper function to synthesize text using Google Translate TTS
async function generateGoogleTts(content: string): Promise<Buffer> {
  const chunks = splitTextIntoChunks(content || '', 160);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=id&client=tw-ob`;
    const audioResponse = await fetch(googleTtsUrl);
    const arrayBuffer = await audioResponse.arrayBuffer();
    audioBuffers.push(Buffer.from(arrayBuffer));
  }

  return Buffer.concat(audioBuffers);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { script_id, file_url, file_name, voice, engine, duration, batch, status = 'generated' } = body;

    if (batch) {
      // BATCH MOCK MODE (triggered from dashboard quick action)
      // Find scripts with status 'ready' or 'draft'
      const { data: scripts } = await supabase.from('scripts').select('*');
      const safeScripts = scripts || [];
      const readyOrDraftScripts = safeScripts.filter((s: any) => s.status === 'ready' || s.status === 'draft');

      if (readyOrDraftScripts.length === 0) {
        return NextResponse.json({
          success: true,
          count: 0,
          message: 'Semua script sudah memiliki audio atau tidak ada script siap pakai.'
        });
      }

      // Generate a mock audio entry for each script
      const createdAudios = [];
      for (const scr of readyOrDraftScripts) {
        // Check if audio already exists for this script
        const { data: existing } = await supabase.from('audios').select('*').eq('script_id', scr.id);
        const hasGenerated = existing && existing.some((a: any) => a.status === 'generated');
        
        if (hasGenerated) continue;

        const mockId = Math.random().toString(36).substring(2, 11);
        const fileName = `ara_${scr.slot || 1}_${new Date().toISOString().split('T')[0]}_${mockId}.mp3`;
        
        // Use premium dynamic Google Translate TTS for a real, natural Indonesian voice reading the script!
        const combinedBuffer = await generateGoogleTts(scr.content || '');

        const audioEntry = {
          script_id: scr.id,
          file_url: '', // Will be updated if uploaded, or we can use dynamic speech URL
          file_name: fileName,
          voice: voice || 'nova',
          duration: scr.duration_estimate || 30,
          status: 'generated'
        };

        // Insert into audios
        const { data: insData } = await supabase.from('audios').insert(audioEntry).select();
        
        // Update script status to 'ready' if it was draft
        await supabase.from('scripts').update({ status: 'ready' }).eq('id', scr.id);

        createdAudios.push(audioEntry);
      }

      return NextResponse.json({
        success: true,
        count: createdAudios.length,
        message: `Berhasil men-generate ${createdAudios.length} audio TTS untuk hari ini.`
      });
    }

    // SINGLE AUDIO RECORD SAVE
    if (!script_id) {
      return NextResponse.json({ success: false, message: 'script_id wajib diisi' }, { status: 400 });
    }

    let finalUrl = file_url;
    let finalFileName = file_name;

    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenlabsApiKey || elevenlabsApiKey === 'your_elevenlabs_api_key') {
      return NextResponse.json({ success: false, message: 'ElevenLabs API Key belum dikonfigurasi di file .env.local' }, { status: 400 });
    }

    const finalVoice = (voice && voice !== 'nova' && voice !== 'shimmer' && voice !== 'coral' && voice !== 'alloy')
      ? voice
      : 'EXAVITQu4vr4xnSDxMaL'; // Default ElevenLabs Bella (Free Plan compatible)

    // If file_url is not provided, generate it server-side and upload to Supabase Storage! (CORS-free!)
    if (!finalUrl) {
      // 1. Get the script content
      const { data: script, error: scriptErr } = await supabase.from('scripts').select('*').eq('id', script_id).single();
      if (scriptErr || !script) {
        return NextResponse.json({ success: false, message: 'Naskah tidak ditemukan' }, { status: 404 });
      }

      let combinedBuffer: Buffer;

      // 2. Synthesize strictly using ElevenLabs
      try {
        const voiceId = finalVoice;
        const elevenlabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        
        const response = await fetch(elevenlabsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elevenlabsApiKey
          },
          body: JSON.stringify({
            text: script.content || '',
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
        combinedBuffer = Buffer.from(arrayBuffer);
        console.log(`Successfully synthesized script using ElevenLabs Voice ${voiceId}`);
      } catch (elErr: any) {
        console.error('ElevenLabs synthesis failed:', elErr);
        return NextResponse.json({ success: false, message: `Gagal membuat suara ElevenLabs: ${elErr.message || elErr}` }, { status: 500 });
      }

      // 3. Generate filename
      const slotNum = script.slot || 1;
      const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const uniqueId = Math.random().toString(36).substring(2, 6);
      finalFileName = `ara_${slotNum}_${todayStr}_elevenlabs_${script.id.substring(0, 4)}_${uniqueId}.mp3`;

      // 4. Upload combined buffer to Supabase Storage
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('audios')
        .upload(finalFileName, combinedBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadErr) {
        console.error('Storage Upload Error:', uploadErr);
        return NextResponse.json({ success: false, message: 'Gagal mengunggah suara ke Storage: ' + uploadErr.message }, { status: 500 });
      }

      // 5. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('audios')
        .getPublicUrl(finalFileName);
      
      finalUrl = publicUrlData?.publicUrl;
    }

    const { data: existing } = await supabase.from('audios').select('*').eq('script_id', script_id);
    const audioData = {
      script_id,
      file_url: finalUrl,
      file_name: finalFileName,
      voice: finalVoice,
      duration: duration || 30,
      status: status || 'generated'
    };

    let result;
    if (existing && existing.length > 0) {
      // Update existing record
      result = await supabase.from('audios').update(audioData).eq('id', existing[0].id).select();
    } else {
      // Insert new record
      result = await supabase.from('audios').insert(audioData).select();
    }

    if (result.error) {
      console.error('Error inserting/updating audio:', result.error);
      return NextResponse.json({ success: false, message: result.error.message }, { status: 500 });
    }

    // Also mark script as 'ready'
    await supabase.from('scripts').update({ status: 'ready' }).eq('id', script_id);

    return NextResponse.json({
      success: true,
      data: result.data || audioData,
      message: 'Status audio berhasil diperbarui di database.'
    });

  } catch (error: any) {
    console.error('Error generating audio route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
