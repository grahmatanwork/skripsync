import { generateText } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { metrics, migrateTracker } from '@/lib/tracker';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  model: z.enum(['gpt', 'gemini']),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string().trim().min(1).max(4000),
  })).max(12).default([]),
}).strict();

const models = {
  gpt: 'openai/gpt-6-luna',
  gemini: 'google/gemini-3.8-flash',
} as const;

const reply = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'private, no-store' },
});

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin) return reply({ error: 'Permintaan tidak diizinkan.' }, 403);

  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = authError ? null : claims?.claims?.sub ?? null;
  if (!userId) return reply({ error: 'Masuk dengan Google untuk berbicara dengan Asri.' }, 401);

  try {
    const raw = await request.text();
    if (raw.length > 30_000) return reply({ error: 'Percakapan terlalu panjang.' }, 413);
    const parsed = requestSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return reply({ error: 'Pesan belum dapat diproses.' }, 400);

    const { data: row, error } = await supabase.from('trackers')
      .select('document').eq('user_id', userId).single();
    if (error || !row) throw error ?? new Error('Data progres tidak ditemukan.');

    const tracker = migrateTracker(row.document);
    const summary = metrics(tracker);
    const tasks = tracker.tasks.slice(0, 120).map(task => ({
      name: task.name,
      segment: tracker.segments.find(segment => segment.id === task.segmentId)?.name ?? 'Tanpa segmen',
      status: task.status,
      due: task.due || null,
      note: task.note || null,
    }));
    const sessions = tracker.sessions.slice(0, 30).map(session => ({
      advisor: session.advisor,
      date: session.date || null,
      material: session.material || null,
      feedback: session.feedback || null,
      followup: session.followup || null,
    }));
    const conversation = [...parsed.data.history, { role: 'user' as const, text: parsed.data.prompt }]
      .map(message => `${message.role === 'user' ? 'Pengguna' : 'Asri'}: ${message.text}`).join('\n\n');

    const result = await generateText({
      model: models[parsed.data.model],
      system: `Kamu adalah Asri, asisten skripsi di aplikasi Skripsync. Jawab dalam Bahasa Indonesia yang hangat, jelas, tidak menggurui, dan praktis. Kamu boleh membantu brainstorming, memecah pekerjaan, membaca urgensi deadline, dan memberi dukungan emosional ringan. Jangan mengarang data skripsi. Jangan mengaku sebagai dosen atau menggantikan arahan akademik. Jika pertanyaan membutuhkan data yang tidak tersedia, katakan dengan jujur lalu ajukan satu pertanyaan singkat. Gunakan konteks akun berikut:\n${JSON.stringify({ profile: { name: tracker.name, program: tracker.program, project: tracker.project, thesisTitle: tracker.thesisTitle, advisors: tracker.advisors }, progress: summary, tasks, sessions })}`,
      prompt: conversation,
      maxOutputTokens: 700,
      temperature: 0.55,
    });

    return reply({ answer: result.text, model: parsed.data.model });
  } catch (error) {
    console.error('Asri generation failed', error);
    return reply({ error: 'Asri sedang sulit terhubung. Coba lagi sebentar.' }, 503);
  }
}
