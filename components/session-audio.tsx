'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload, LoaderCircle, Headphones, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Recording } from '@/lib/tracker';

const MAX_SIZE = 25 * 1024 * 1024;
const BUCKET = 'bimbingan-audio';
const TYPES: Record<string, string> = { 'audio/webm':'webm', 'audio/mp4':'m4a', 'audio/mpeg':'mp3', 'audio/ogg':'ogg', 'audio/wav':'wav', 'audio/x-wav':'wav', 'audio/aac':'aac', 'audio/x-m4a':'m4a' };

const WAVE = [14,20,27,18,11,21,30,23,15,11,23,30,37,26,19,12,23,34,40,27,20,12,19,27,20,13,17,25,34,21,14,23,28,20,13,19,25,15,10,18];
const formatTime = (seconds: number) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,'0')}` : '--:--';

function AudioPlayer({ src, label }: { src: string; label: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing,setPlaying] = useState(false);
  const [current,setCurrent] = useState(0);
  const [duration,setDuration] = useState(0);
  const [failed,setFailed] = useState(false);
  const progress = duration > 0 ? Math.min(100,current / duration * 100) : 0;
  return <div className="audio-player">
    <audio ref={audio} src={src} preload="metadata" onLoadedMetadata={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onDurationChange={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onTimeUpdate={e=>setCurrent(e.currentTarget.currentTime)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>setFailed(true)}/>
    <button type="button" className="audio-player-toggle" aria-label={`${playing?'Jeda':'Putar'} ${label}`} disabled={failed} onClick={()=>{const el=audio.current;if(!el)return;if(el.paused)void el.play().catch(()=>setFailed(true));else el.pause();}}>{playing?<Pause size={19} fill="currentColor"/>:<Play size={19} fill="currentColor"/>}</button>
    <div className="audio-player-wave"><div className="audio-player-bars" aria-hidden="true">{WAVE.map((height,index)=><span key={index} className={index / WAVE.length * 100 < progress?'played':''} style={{height}}/>)}</div><input type="range" min={0} max={duration || 1} step="0.1" value={Math.min(current,duration||1)} disabled={!duration || failed} aria-label={`Posisi pemutaran ${label}`} aria-valuetext={`${formatTime(current)} dari ${formatTime(duration)}`} onChange={e=>{const next=Number(e.target.value);if(audio.current)audio.current.currentTime=next;setCurrent(next);}}/></div>
    <span className="audio-player-time">{failed?'Tidak dapat diputar':formatTime(duration || current)}</span>
  </div>;
}

function Player({ recording }: { recording: Recording }) {
  const [url, setUrl] = useState('');
  const [problem, setProblem] = useState(false);
  useEffect(() => {
    let active = true;
    createClient().storage.from(BUCKET).createSignedUrl(recording.path, 3600).then(({data,error}) => {
      if (active) { setUrl(data?.signedUrl || ''); setProblem(!!error); }
    });
    return () => { active = false; };
  }, [recording.path]);
  return <div className="session-audio-item"><div className="session-audio-meta"><Headphones size={17}/><strong>{recording.name}</strong><small>{(recording.size / 1048576).toFixed(1)} MB</small></div>{url ? <AudioPlayer src={url} label={recording.name}/> : <small>{problem ? 'Rekaman tidak dapat dibuka. Coba buka ulang sesi.' : 'Menyiapkan rekaman…'}</small>}</div>;
}

export function SessionAudio({ recordings, onAttach, disabled }: { recordings: Recording[]; onAttach: (recording: Recording) => Promise<boolean>; disabled: boolean }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bytes = useRef(0);
  const mounted = useRef(true);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Blob | null>(null);
  const [pendingUrl, setPendingUrl] = useState('');
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); }; }, []);
  useEffect(() => { if (!pending) { setPendingUrl(''); return; } const url = URL.createObjectURL(pending); setPendingUrl(url); return () => URL.revokeObjectURL(url); }, [pending]);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { toast.error('Browser ini belum mendukung perekaman suara. Kamu tetap bisa mengunggah audio.'); return; }
    try {
      const media = await navigator.mediaDevices.getUserMedia({audio:true});
      if (!mounted.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media; chunks.current = []; bytes.current = 0;
      const mime = ['audio/webm','audio/mp4','audio/ogg'].find(type => MediaRecorder.isTypeSupported(type));
      const instance = new MediaRecorder(media, mime ? {mimeType:mime} : undefined);
      recorder.current = instance;
      instance.ondataavailable = event => { if (event.data.size) { chunks.current.push(event.data); bytes.current += event.data.size; if (bytes.current > MAX_SIZE && instance.state === 'recording') instance.stop(); } };
      instance.onstop = () => { media.getTracks().forEach(track => track.stop()); if (!mounted.current) return; setRecording(false); const blob = new Blob(chunks.current, {type:instance.mimeType.split(';')[0] || 'audio/webm'}); if (blob.size > MAX_SIZE) toast.error('Rekaman melebihi 25 MB. Coba rekam dalam beberapa bagian.'); else if (blob.size) setPending(blob); };
      instance.onerror = () => { media.getTracks().forEach(track => track.stop()); if (mounted.current) { setRecording(false); toast.error('Perekaman terhenti. Coba lagi.'); } };
      instance.start(1000); setRecording(true);
    } catch { stream.current?.getTracks().forEach(track => track.stop()); toast.error('Mikrofon tidak dapat diakses. Periksa izin mikrofon di browser.'); }
  }

  async function saveAudio(blob: Blob, originalName?: string) {
    const type = blob.type.split(';')[0];
    if (!TYPES[type]) { toast.error('Format belum didukung. Gunakan MP3, M4A, WAV, OGG, AAC, atau WebM.'); return; }
    if (!blob.size || blob.size > MAX_SIZE) { toast.error('Ukuran audio harus antara 1 byte dan 25 MB.'); return; }
    if (recordings.length >= 50) { toast.error('Maksimal 50 rekaman per sesi.'); return; }
    setBusy(true);
    try {
      const client = createClient();
      const {data:auth, error:authError} = await client.auth.getUser();
      if (authError || !auth.user) throw new Error('Sesi login berakhir. Silakan masuk kembali.');
      const id = crypto.randomUUID(), path = `${auth.user.id}/${id}.${TYPES[type]}`;
      const {error} = await client.storage.from(BUCKET).upload(path, blob, {contentType:type, upsert:false});
      if (error) throw new Error('Audio belum berhasil diunggah. Periksa koneksi dan coba lagi.');
      const name = (originalName || `Rekaman ${new Date().toLocaleString('id-ID')}`).slice(0,160);
      const saved = await onAttach({id,path,name,createdAt:new Date().toISOString(),size:blob.size});
      if (!saved) { await client.storage.from(BUCKET).remove([path]); throw new Error('Audio belum berhasil ditautkan ke sesi. Coba lagi.'); }
      if (mounted.current) setPending(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Audio belum berhasil disimpan.'); }
    finally { if (mounted.current) setBusy(false); }
  }

  return <section className="session-audio"><div className="session-audio-heading"><span><Mic size={19}/></span><div><strong>Rekaman bimbingan</strong><p>Rekam atau unggah audio untuk disimpan bersama sesi ini.</p></div></div><p className="caption">Pastikan semua peserta setuju sebelum merekam. Maksimal 25 MB per file.</p><div className="session-audio-actions">{recording ? <Button type="button" variant="outline" onClick={() => recorder.current?.stop()}><Square size={15}/>Berhenti merekam</Button> : <Button type="button" variant="outline" onClick={() => void start()} disabled={busy || disabled || !!pending}><Mic size={16}/>Mulai rekam</Button>}<label className={'session-audio-upload' + (busy || recording || disabled || !!pending ? ' is-disabled' : '')}><Upload size={16}/>Unggah audio<input type="file" accept="audio/*" disabled={busy || recording || disabled || !!pending} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void saveAudio(file,file.name); }}/></label></div>{recording && <p className="session-recording-status" role="status"><span/>Sedang merekam…</p>}{pending && <div className="session-audio-preview"><strong>Pratinjau rekaman</strong>{pendingUrl && <AudioPlayer src={pendingUrl} label="pratinjau rekaman"/>}<div><Button type="button" onClick={() => void saveAudio(pending)} disabled={busy || disabled}>{busy ? <LoaderCircle className="spin" size={16}/> : null}Simpan rekaman</Button><Button type="button" variant="ghost" onClick={() => setPending(null)} disabled={busy}>Buang</Button></div></div>}{busy && <p className="caption" role="status">Menyimpan audio, jangan tutup halaman…</p>}{recordings.length > 0 && <div className="session-audio-list">{recordings.map(item => <Player key={item.id} recording={item}/>)}</div>}</section>;
}
