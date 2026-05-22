import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { script_id, audio_id, template_type = 'coding_neon', batch } = body;

    // 1. Batch Video Generation Mode (for automated bulk tasks)
    if (batch) {
      // Find scripts with generated audio that don't have video yet
      const { data: scripts } = await supabase.from('scripts').select('*');
      const { data: audios } = await supabase.from('audios').select('*').eq('status', 'generated');
      const { data: existingVideos } = await supabase.from('videos').select('*');

      const safeScripts = scripts || [];
      const safeAudios = audios || [];
      const safeVideos = existingVideos || [];

      // Filter eligible scripts: has audio, but no video
      const eligible = safeScripts.filter((scr: any) => {
        const hasAudio = safeAudios.some((aud: any) => aud.script_id === scr.id);
        const hasVideo = safeVideos.some((vid: any) => vid.script_id === scr.id);
        return hasAudio && !hasVideo;
      });

      if (eligible.length === 0) {
        return NextResponse.json({
          success: true,
          count: 0,
          message: 'Semua naskah yang ber-audio sudah memiliki video.'
        });
      }

      const createdVideos = [];
      const videoTemplates = {
        coding_neon: 'https://assets.mixkit.co/videos/34282/34282-720.mp4',
        retro_terminal: 'https://assets.mixkit.co/videos/34283/34283-720.mp4',
        cyber_matrix: 'https://assets.mixkit.co/videos/42864/42864-720.mp4',
        ara_influencer_explainer: 'https://assets.mixkit.co/videos/40245/40245-720.mp4'
      };

      for (const scr of eligible) {
        const matchedAudio = safeAudios.find((a: any) => a.script_id === scr.id);
        if (!matchedAudio) continue;

        const mockId = Math.random().toString(36).substring(2, 6);
        const selectedTheme = scr.category === 'css' ? 'coding_neon' : scr.category === 'python' ? 'cyber_matrix' : 'ara_influencer_explainer';
        
        const videoEntry = {
          script_id: scr.id,
          audio_id: matchedAudio.id,
          file_url: videoTemplates[selectedTheme as keyof typeof videoTemplates] || videoTemplates.ara_influencer_explainer,
          file_name: `ara_render_${scr.slot || 1}_${new Date().toISOString().split('T')[0]}_${mockId}.mp4`,
          template_type: selectedTheme,
          video_metadata: {
            size: '22.8MB',
            resolution: '1080x1920 (Vertical Speaker)',
            duration: scr.duration_estimate || 38
          }
        };

        await supabase.from('videos').insert(videoEntry).select();
        // Mark script as 'ready' (completely generated and ready for calendar scheduler)
        await supabase.from('scripts').update({ status: 'ready' }).eq('id', scr.id);

        createdVideos.push(videoEntry);
      }

      return NextResponse.json({
        success: true,
        count: createdVideos.length,
        message: `Berhasil merender ${createdVideos.length} video coding otomatis Ara.`
      });
    }

    // 2. Single Video Generation Mode (Interactive Workflow)
    if (!script_id) {
      return NextResponse.json({ success: false, message: 'script_id wajib diisi' }, { status: 400 });
    }

    const { data: existing } = await supabase.from('videos').select('*').eq('script_id', script_id);
    
    // Choose high quality stock video stream based on selected template theme
    let fileUrl = 'https://assets.mixkit.co/videos/34282/34282-720.mp4'; // neon default
    if (template_type === 'retro_terminal') {
      fileUrl = 'https://assets.mixkit.co/videos/34283/34283-720.mp4';
    } else if (template_type === 'cyber_matrix') {
      fileUrl = 'https://assets.mixkit.co/videos/42864/42864-720.mp4';
    } else if (template_type === 'ara_influencer_explainer') {
      fileUrl = 'https://assets.mixkit.co/videos/40245/40245-720.mp4';
    }

    const mockId = Math.random().toString(36).substring(2, 6);
    const videoData = {
      script_id,
      audio_id: audio_id || null,
      file_url: fileUrl,
      file_name: `ara_video_render_${mockId}.mp4`,
      template_type: template_type || 'ara_influencer_explainer',
      video_metadata: {
        size: template_type === 'ara_influencer_explainer' ? '22.8MB' : '15.4MB',
        resolution: '1080x1920 (Vertical Explainer)',
        duration: 38
      }
    };

    let result;
    const existingList = existing || [];
    if (existingList.length > 0) {
      result = await supabase.from('videos').update(videoData).eq('id', existingList[0].id);
    } else {
      result = await supabase.from('videos').insert(videoData).select();
    }

    if (result.error) {
      console.error('Error inserting video record:', result.error);
      return NextResponse.json({ success: false, message: result.error.message }, { status: 550 });
    }

    // Force script status to 'ready'
    await supabase.from('scripts').update({ status: 'ready' }).eq('id', script_id);

    return NextResponse.json({
      success: true,
      video: videoData,
      message: 'Video Ara berhasil dirender dan disimpan ke Bank Galeri.'
    });

  } catch (error: any) {
    console.error('Error in video generate API:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
