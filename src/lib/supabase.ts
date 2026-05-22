import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is actually configured with real keys
export const isMockDb =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('ISI URL') ||
  supabaseUrl.includes('YOUR_') ||
  supabaseAnonKey.includes('ISI KEY') ||
  supabaseAnonKey.includes('YOUR_');

// Set up the real Supabase client (only if configured)
let realSupabase: any = null;
if (!isMockDb) {
  try {
    realSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Failed to initialize real Supabase client, using mock instead:', e);
  }
}

// Pre-populated mock data structure
const DEFAULT_TOPICS = [
  { id: 't1', keyword: 'Flexbox vs Grid: Mana yang Lebih Bagus?', category: 'css', trending_score: 95, used: true, created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
  { id: 't2', keyword: '3 Fitur JavaScript Modern yang Wajib Kamu Tahu', category: 'javascript', trending_score: 88, used: true, created_at: new Date(Date.now() - 4*24*60*60*1000).toISOString() },
  { id: 't3', keyword: 'Cara Mudah Menggunakan useState dan useEffect di React', category: 'react', trending_score: 92, used: true, created_at: new Date(Date.now() - 3*24*60*60*1000).toISOString() },
  { id: 't4', keyword: 'Trik Cepat Menulis Python List Comprehension', category: 'python', trending_score: 85, used: false, created_at: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
  { id: 't5', keyword: 'Kenapa Kamu Harus Paham Git Rebase vs Merge?', category: 'git', trending_score: 79, used: false, created_at: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
];

const DEFAULT_SCRIPTS = [
  {
    id: 's1',
    topic_id: 't1',
    title: 'Flexbox vs Grid',
    content: 'Woi anak IT! Masih bingung beda Flexbox sama CSS Grid? Sini aku kasih tahu rahasianya! Flexbox itu kayak barisan antrean satu dimensi, cocok buat susun menu horizontal atau vertical. Kalau Grid itu kayak papan catur dua dimensi, mantap banget buat bikin layout halaman web yang kompleks. Jadi, kapan pakai Flexbox? Pas kamu cuma butuh sejajarin elemen kiri-kanan atau atas-bawah. Kapan pakai Grid? Pas layout kamu punya baris dan kolom yang presisi. Jangan ketuker lagi ya! Mau jago CSS? Follow Ara sekarang juga!',
    hook: 'Woi anak IT! Masih bingung beda Flexbox sama CSS Grid? Sini aku kasih tahu rahasianya!',
    cta: 'Jangan ketuker lagi ya! Mau jago CSS? Follow Ara sekarang juga!',
    duration_estimate: 30,
    slot: 1, // Pagi
    status: 'used',
    created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString()
  },
  {
    id: 's2',
    topic_id: 't2',
    title: '3 Fitur JS Modern',
    content: 'Guys! 2026 masih pakai cara lama coding JavaScript? Ini 3 fitur modern yang wajib kamu kuasai sekarang juga! Pertama, Optional Chaining dengan tanda tanya titik. Bye-bye error undefined! Kedua, Nullish Coalescing dengan tanda tanya ganda. Lebih aman buat default value daripada operator OR. Ketiga, Destructuring Array dan Object biar kode kamu makin clean dan kelihatan pro. Mana yang paling sering kamu pakai? Tulis di kolom komentar dan jangan lupa follow Ara buat tips coding seru lainnya!',
    hook: 'Guys! 2026 masih pakai cara lama coding JavaScript? Ini 3 fitur modern yang wajib kamu kuasai!',
    cta: 'Mana yang paling sering kamu pakai? Tulis di kolom komentar dan jangan lupa follow Ara!',
    duration_estimate: 45,
    slot: 2, // Siang
    status: 'used',
    created_at: new Date(Date.now() - 4*24*60*60*1000).toISOString()
  },
  {
    id: 's3',
    topic_id: 't3',
    title: 'useState & useEffect React',
    content: 'React developer pemula, merapat! Aku mau jelasin dua hook paling penting di React cuma dalam 45 detik. useState itu kayak memori jangka pendek komponen kamu. Kalau isinya diubah, komponen langsung re-render otomatis. Nah, kalau useEffect itu kayak mata-mata yang mantau perubahan data. Begitu data berubah, dia bakal jalanin efek samping kayak fetch API atau update document title. Gampang kan? Jangan dibikin pusing! Share video ini ke temen kamu yang baru belajar React dan follow Ara!',
    hook: 'React developer pemula, merapat! Aku mau jelasin dua hook paling penting di React cuma dalam 45 detik!',
    cta: 'Jangan dibikin pusing! Share video ini ke temen kamu yang baru belajar React dan follow Ara!',
    duration_estimate: 45,
    slot: 3, // Malam
    status: 'ready',
    created_at: new Date(Date.now() - 3*24*60*60*1000).toISOString()
  }
];

const DEFAULT_AUDIOS = [
  {
    id: 'a1',
    script_id: 's1',
    file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Free test mp3
    file_name: 'ara_1_20260515_a1.mp3',
    voice: 'nova',
    duration: 30,
    status: 'generated',
    created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString()
  },
  {
    id: 'a2',
    script_id: 's2',
    file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    file_name: 'ara_2_20260516_a2.mp3',
    voice: 'shimmer',
    duration: 45,
    status: 'generated',
    created_at: new Date(Date.now() - 4*24*60*60*1000).toISOString()
  }
];

const DEFAULT_CALENDAR = [
  {
    id: 'c1',
    audio_id: 'a1',
    script_id: 's1',
    scheduled_date: new Date(Date.now() - 2*24*60*60*1000).toISOString().split('T')[0],
    scheduled_time: '07:00:00',
    platform: 'tiktok,instagram,youtube',
    caption: 'Flexbox vs CSS Grid, mana jagoan kalian? 😎🔥 #coding #css #webdev #programmer #indonesia',
    hashtags: '#coding #css #webdev #programmer #indonesia #ara',
    status: 'posted',
    created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString()
  },
  {
    id: 'c2',
    audio_id: 'a2',
    script_id: 's2',
    scheduled_date: new Date(Date.now() - 1*24*60*60*1000).toISOString().split('T')[0],
    scheduled_time: '12:00:00',
    platform: 'tiktok,instagram',
    caption: 'Fitur JS modern bikin ngoding secepat kilat! ⚡️💻 #javascript #js #programming #belajarcoding',
    hashtags: '#javascript #js #programming #belajarcoding #ara',
    status: 'posted',
    created_at: new Date(Date.now() - 4*24*60*60*1000).toISOString()
  },
  {
    id: 'c3',
    audio_id: 'a2', // Reusing a2 for demo
    script_id: 's3',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '19:00:00',
    platform: 'tiktok,youtube',
    caption: 'Pahami useState & useEffect biar gak kebingungan lagi! ⚛️ #reactjs #nextjs #coding #programmer',
    hashtags: '#reactjs #nextjs #coding #programmer #ara',
    status: 'scheduled',
    created_at: new Date(Date.now() - 3*24*60*60*1000).toISOString()
  }
];

const DEFAULT_ANALYTICS = [
  {
    id: 'an1',
    calendar_id: 'c1',
    platform: 'tiktok',
    views: 12500,
    likes: 2300,
    comments: 145,
    shares: 89,
    recorded_at: new Date(Date.now() - 2*24*60*60*1000).toISOString()
  },
  {
    id: 'an2',
    calendar_id: 'c1',
    platform: 'instagram',
    views: 8900,
    likes: 1200,
    comments: 54,
    shares: 34,
    recorded_at: new Date(Date.now() - 2*24*60*60*1000).toISOString()
  },
  {
    id: 'an3',
    calendar_id: 'c2',
    platform: 'tiktok',
    views: 15400,
    likes: 3100,
    comments: 210,
    shares: 120,
    recorded_at: new Date(Date.now() - 1*24*60*60*1000).toISOString()
  },
  {
    id: 'an4',
    calendar_id: 'c2',
    platform: 'instagram',
    views: 11200,
    likes: 1800,
    comments: 98,
    shares: 55,
    recorded_at: new Date(Date.now() - 1*24*60*60*1000).toISOString()
  }
];

const DEFAULT_VIDEOS = [
  {
    id: 'v1',
    script_id: 's1',
    audio_id: 'a1',
    file_url: 'https://assets.mixkit.co/videos/preview/mixkit-coding-on-a-computer-screen-close-up-34282-large.mp4',
    file_name: 'ara_video_1.mp4',
    template_type: 'coding_neon',
    video_metadata: { size: '12MB', resolution: '1080x1920', duration: 30 },
    created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString()
  }
];

// Helper to interact with LocalStorage-based Mock DB
class MockDatabase {
  private getStore(key: string, defaults: any[]) {
    if (typeof window === 'undefined') return defaults;
    const val = localStorage.getItem(`ara_${key}`);
    if (!val) {
      localStorage.setItem(`ara_${key}`, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(val);
  }

  private saveStore(key: string, data: any[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ara_${key}`, JSON.stringify(data));
    }
  }

  private getTableData(table: string): any[] {
    switch (table) {
      case 'topics': return this.getStore('topics', DEFAULT_TOPICS);
      case 'scripts': return this.getStore('scripts', DEFAULT_SCRIPTS);
      case 'audios': return this.getStore('audios', DEFAULT_AUDIOS);
      case 'content_calendar': return this.getStore('content_calendar', DEFAULT_CALENDAR);
      case 'analytics': return this.getStore('analytics', DEFAULT_ANALYTICS);
      case 'videos': return this.getStore('videos', DEFAULT_VIDEOS);
      default: return [];
    }
  }

  private saveTableData(table: string, data: any[]) {
    switch (table) {
      case 'topics': this.saveStore('topics', data); break;
      case 'scripts': this.saveStore('scripts', data); break;
      case 'audios': this.saveStore('audios', data); break;
      case 'content_calendar': this.saveStore('content_calendar', data); break;
      case 'analytics': this.saveStore('analytics', data); break;
      case 'videos': this.saveStore('videos', data); break;
    }
  }

  // Builder mimic interface
  public from(table: string) {
    const data = this.getTableData(table);
    let filtered = [...data];

    const builder = {
      select: (columns: string = '*') => {
        // Return a promise with { data: filtered, error: null }
        const p = Promise.resolve({ data: [...filtered], error: null });
        // Add typical promise chains or custom methods
        return Object.assign(p, {
          order: (col: string, { ascending = true } = {}) => {
            const sorted = [...filtered].sort((a, b) => {
              const valA = a[col];
              const valB = b[col];
              if (valA < valB) return ascending ? -1 : 1;
              if (valA > valB) return ascending ? 1 : -1;
              return 0;
            });
            return Promise.resolve({ data: sorted, error: null });
          },
          eq: (col: string, val: any) => {
            const eqFiltered = filtered.filter(item => item[col] === val);
            return Promise.resolve({ data: eqFiltered, error: null });
          }
        });
      },
      insert: (rows: any | any[]) => {
        const toInsert = Array.isArray(rows) ? rows : [rows];
        const newRows = toInsert.map(row => ({
          id: row.id || Math.random().toString(36).substring(2, 11) + '-' + Math.random().toString(36).substring(2, 6),
          created_at: new Date().toISOString(),
          ...row
        }));
        const updated = [...data, ...newRows];
        this.saveTableData(table, updated);
        const result = { data: newRows, error: null };
        const p = Promise.resolve(result);
        return Object.assign(p, {
          select: (columns: string = '*') => {
            return Promise.resolve(result);
          }
        });
      },
      update: (fields: any) => {
        return {
          eq: (col: string, val: any) => {
            const updated = data.map(item => {
              if (item[col] === val) {
                return { ...item, ...fields };
              }
              return item;
            });
            this.saveTableData(table, updated);
            const affected = updated.filter(item => item[col] === val);
            const result = { data: affected, error: null };
            const p = Promise.resolve(result);
            return Object.assign(p, {
              select: (columns: string = '*') => {
                return Promise.resolve(result);
              }
            });
          }
        };
      },
      delete: () => {
        return {
          eq: (col: string, val: any) => {
            const updated = data.filter(item => item[col] !== val);
            this.saveTableData(table, updated);
            const result = { data: [], error: null };
            const p = Promise.resolve(result);
            return Object.assign(p, {
              select: (columns: string = '*') => {
                return Promise.resolve(result);
              }
            });
          }
        };
      }
    };
    return builder;
  }

  // Storage mimic interface
  public get storage() {
    return {
      from: (bucket: string) => {
        return {
          upload: async (path: string, file: Blob) => {
            // Mock success upload
            const fileUrl = URL.createObjectURL(file);
            return { data: { path, fileUrl }, error: null };
          },
          getPublicUrl: (path: string) => {
            // In Mock, we retrieve it from the audio list, or return a placeholder MP3
            return {
              data: {
                publicUrl: path.startsWith('blob:') ? path : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
              }
            };
          }
        };
      }
    };
  }
}

const mockDatabaseInstance = new MockDatabase();

// Export the active supabase client
export const supabase = isMockDb ? (mockDatabaseInstance as any) : realSupabase;
