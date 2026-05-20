import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Fetch all scripts, audios, calendar, and analytics
    const { data: scripts, error: scriptErr } = await supabase.from('scripts').select('*');
    const { data: audios, error: audioErr } = await supabase.from('audios').select('*');
    const { data: calendar, error: calErr } = await supabase.from('content_calendar').select('*');
    
    if (scriptErr || audioErr || calErr) {
      console.error('Error fetching dashboard stats:', { scriptErr, audioErr, calErr });
      // Proceed with empty defaults if real Supabase errors, but since we have mock fallback, it's fine.
    }

    const safeScripts = scripts || [];
    const safeAudios = audios || [];
    const safeCalendar = calendar || [];

    // 2. Compute statistics
    const today = new Date().toISOString().split('T')[0];
    
    // Scripts today
    const scriptsToday = safeScripts.filter((s: any) => s.created_at?.startsWith(today)).length;
    
    // Total audios generated
    const audiosGenerated = safeAudios.filter((a: any) => a.status === 'generated').length;
    
    // Scheduled this week (next 7 days starting today)
    const todayMs = new Date().setHours(0,0,0,0);
    const sevenDaysLaterMs = todayMs + 7 * 24 * 60 * 60 * 1000;
    const scheduledThisWeek = safeCalendar.filter((c: any) => {
      const cDate = new Date(c.scheduled_date).getTime();
      return cDate >= todayMs && cDate <= sevenDaysLaterMs && c.status === 'scheduled';
    }).length;

    // Total content posted
    const contentPosted = safeCalendar.filter((c: any) => c.status === 'posted').length;

    // 3. Compute slots for today
    // Let's find scheduled or posted calendar items for today
    const todayItems = safeCalendar.filter((c: any) => c.scheduled_date === today);
    
    const slots = [
      { 
        slot: 1, 
        time: '07:00', 
        name: 'Slot Pagi', 
        item: todayItems.find((c: any) => {
          // Find script to see if it matches slot 1
          const scr = safeScripts.find((s: any) => s.id === c.script_id);
          return scr?.slot === 1 || c.scheduled_time?.startsWith('07:') || c.scheduled_time?.startsWith('7:');
        }) || null 
      },
      { 
        slot: 2, 
        time: '12:00', 
        name: 'Slot Siang', 
        item: todayItems.find((c: any) => {
          const scr = safeScripts.find((s: any) => s.id === c.script_id);
          return scr?.slot === 2 || c.scheduled_time?.startsWith('12:');
        }) || null 
      },
      { 
        slot: 3, 
        time: '19:00', 
        name: 'Slot Malam', 
        item: todayItems.find((c: any) => {
          const scr = safeScripts.find((s: any) => s.id === c.script_id);
          return scr?.slot === 3 || c.scheduled_time?.startsWith('19:');
        }) || null 
      }
    ];

    // For any empty slot today, let's see if we have ready scripts matching that slot number
    const slotsWithScripts = slots.map(sl => {
      if (sl.item) {
        // Find matching script and audio
        const matchedScript = safeScripts.find((s: any) => s.id === sl.item.script_id);
        const matchedAudio = safeAudios.find((a: any) => a.id === sl.item.audio_id);
        return {
          ...sl,
          status: sl.item.status, // scheduled, posted, skipped
          title: matchedScript?.title || 'Konten Terjadwal',
          audio_url: matchedAudio?.file_url || null,
          audio_id: matchedAudio?.id || null,
          script_id: matchedScript?.id || null,
          platforms: sl.item.platform.split(','),
        };
      } else {
        // No scheduled item. Check if there is a ready or draft script in database for this slot
        const readyScript = safeScripts.find((s: any) => s.slot === sl.slot && s.status === 'ready');
        const draftScript = safeScripts.find((s: any) => s.slot === sl.slot && s.status === 'draft');
        const activeScript = readyScript || draftScript;
        
        let status = 'empty';
        if (activeScript) {
          status = activeScript.status === 'ready' ? 'ready_to_schedule' : 'script_draft';
        }

        const matchedAudio = activeScript ? safeAudios.find((a: any) => a.script_id === activeScript.id) : null;

        return {
          ...sl,
          status,
          title: activeScript?.title || 'Belum Ada Konten',
          audio_url: matchedAudio?.file_url || null,
          audio_id: matchedAudio?.id || null,
          script_id: activeScript?.id || null,
          platforms: [],
        };
      }
    });

    // 4. Generate dynamic activity logs
    const activityLogs: any[] = [];
    
    // Sort all records to construct a beautiful unified activity log
    const sortedScripts = [...safeScripts].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);
    const sortedAudios = [...safeAudios].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);
    const sortedCal = [...safeCalendar].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

    sortedScripts.forEach((s: any) => {
      activityLogs.push({
        id: `act-s-${s.id}`,
        type: 'script',
        message: `Script "${s.title}" berhasil dibuat [Kategori: ${s.category?.toUpperCase() || 'CODING'}]`,
        time: s.created_at
      });
    });

    sortedAudios.forEach((a: any) => {
      const scr = safeScripts.find((s: any) => s.id === a.script_id);
      activityLogs.push({
        id: `act-a-${a.id}`,
        type: 'audio',
        message: `Audio TTS Ara berhasil digenerate untuk script "${scr?.title || 'Coding'}" [Voice: ${a.voice}]`,
        time: a.created_at
      });
    });

    sortedCal.forEach((c: any) => {
      const scr = safeScripts.find((s: any) => s.id === c.script_id);
      const platformsUpper = c.platform.split(',').map((p: string) => p.toUpperCase()).join(', ');
      activityLogs.push({
        id: `act-c-${c.id}`,
        type: 'calendar',
        message: `Konten "${scr?.title || 'Coding'}" dijadwalkan di ${platformsUpper} pada ${c.scheduled_date} ${c.scheduled_time}`,
        time: c.created_at
      });
    });

    // Sort combined logs by time descending
    const finalLogs = activityLogs
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        scriptsToday,
        audiosGenerated,
        scheduledThisWeek,
        contentPosted
      },
      slots: slotsWithScripts,
      activityLog: finalLogs
    });

  } catch (error: any) {
    console.error('Error generating dashboard stats route:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
