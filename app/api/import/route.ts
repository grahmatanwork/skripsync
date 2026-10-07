import { createClient } from '@/lib/supabase/server';
import { trackerSchema } from '@/lib/tracker';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin) return Response.json({ error: 'Permintaan tidak diizinkan.' }, { status: 403 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return Response.json({ error: 'Masuk dengan Google terlebih dahulu.' }, { status: 401 });
  try {
    const body = await request.text();
    if (body.length > 2_500_000) return Response.json({ error: 'File terlalu besar.' }, { status: 413 });
    const parsed = JSON.parse(body) as { data?: unknown };
    const document = trackerSchema.safeParse(parsed.data);
    if (!document.success) return Response.json({ error: 'Format data Skripsync lama tidak valid.' }, { status: 400 });
    const { data: row, error } = await supabase.from('trackers')
      .select('revision').eq('user_id', claims.sub).single();
    if (error || !row) return Response.json({ error: 'Buka dashboard baru sekali sebelum mengimpor.' }, { status: 409 });
    if (row.revision !== 0) return Response.json({ error: 'Data akun baru sudah berubah. Impor dihentikan agar tidak menimpa progresmu.' }, { status: 409 });
    const { data: updated, error: saveError } = await supabase.from('trackers')
      .update({ document: document.data, revision: 1 })
      .eq('user_id', claims.sub).eq('revision', 0).select('revision').maybeSingle();
    if (saveError) throw saveError;
    if (!updated) return Response.json({ error: 'Data berubah saat impor. Muat ulang.' }, { status: 409 });
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: 'File JSON tidak valid.' }, { status: 400 });
    console.error('Import failed', error);
    return Response.json({ error: 'Impor belum berhasil.' }, { status: 503 });
  }
}
