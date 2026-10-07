import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { initialTracker, migrateTracker, trackerSchema } from '@/lib/tracker';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const cleanDate = (value: unknown) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const parsed = new Date(value + 'T12:00:00Z');
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? '' : value;
};

async function identity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return { supabase, userId: error ? null : data?.claims?.sub ?? null };
}

export async function GET() {
  const { supabase, userId } = await identity();
  if (!userId) return reply({ error: 'Masuk dengan Google untuk membuka progresmu.' }, 401);
  try {
    const { error: initError } = await supabase.from('trackers')
      .upsert({ user_id: userId, document: initialTracker(), revision: 0 }, { onConflict: 'user_id', ignoreDuplicates: true });
    if (initError) throw initError;
    const { data: row, error } = await supabase.from('trackers')
      .select('document, revision, updated_at').eq('user_id', userId).single();
    if (error || !row) throw error ?? new Error('Data tidak ditemukan');
    const raw = row.document as Record<string, unknown>;
    const migrated = {
      ...raw,
      profilePhoto: raw.profilePhoto ?? '',
      tasks: (Array.isArray(raw.tasks) ? raw.tasks : []).map((task) => ({ ...(task as object), due: cleanDate((task as { due?: unknown }).due) })),
      sessions: (Array.isArray(raw.sessions) ? raw.sessions : []).map((session) => ({ ...(session as object), date: cleanDate((session as { date?: unknown }).date) })),
      logs: (Array.isArray(raw.logs) ? raw.logs : []).filter((log) => cleanDate((log as { date?: unknown }).date)),
    };
    const data = migrateTracker(migrated);
    if (JSON.stringify(data) !== JSON.stringify(raw)) {
      const { data: updated } = await supabase.from('trackers')
        .update({ document: data, revision: row.revision + 1 })
        .eq('user_id', userId).eq('revision', row.revision)
        .select('revision, updated_at').maybeSingle();
      if (updated) return reply({ data, revision: updated.revision, updatedAt: updated.updated_at });
    }
    return reply({ data, revision: row.revision, updatedAt: row.updated_at });
  } catch (error) {
    console.error('Load tracker failed', error);
    return reply({ error: 'Progres belum dapat dibuka. Coba lagi sebentar.' }, 503);
  }
}

export async function PUT(request: Request) {
  const { supabase, userId } = await identity();
  if (!userId) return reply({ error: 'Masuk dengan Google untuk menyimpan progresmu.' }, 401);
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin) return reply({ error: 'Permintaan tidak diizinkan.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 2_500_000) return reply({ error: 'Data terlalu besar.' }, 413);
    const parsed = z.object({ data: trackerSchema, revision: z.number().int().min(0) }).strict().safeParse(JSON.parse(raw));
    if (!parsed.success) return reply({ error: 'Periksa kembali data yang kamu isi.' }, 400);
    const { data: updated, error } = await supabase.from('trackers')
      .update({ document: parsed.data.data, revision: parsed.data.revision + 1 })
      .eq('user_id', userId).eq('revision', parsed.data.revision)
      .select('revision, updated_at').maybeSingle();
    if (error) throw error;
    if (!updated) return reply({ error: 'Data berubah di perangkat lain. Muat ulang sebelum menyimpan.' }, 409);
    return reply({ data: parsed.data.data, revision: updated.revision, updatedAt: updated.updated_at });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ error: 'Data tidak valid.' }, 400);
    console.error('Save tracker failed', error);
    return reply({ error: 'Belum berhasil tersimpan. Coba lagi.' }, 503);
  }
}
