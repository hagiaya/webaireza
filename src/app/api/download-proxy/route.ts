import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'video.mp4';

    if (!url) {
      return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });
    }

    // Fetch the video from the target URL with custom Referer header to bypass hotlink block
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://mixkit.co/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        message: `Failed to fetch video from CDN: ${response.statusText}` 
      }, { status: response.status });
    }

    // Get the video data stream
    const data = await response.arrayBuffer();

    // Return the file directly as an attachment response stream
    return new Response(data, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error: any) {
    console.error('Error in download proxy:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
