import { z } from 'zod';

const date = z.string().refine(
  value => value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value),
  'Tanggal tidak valid',
);
const time = z.string().refine(value => value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), 'Jam tidak valid');

export const segmentColors = ['lime', 'mint', 'blue', 'violet', 'peach', 'rose'] as const;
export const segmentSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(60),
  color: z.enum(segmentColors),
}).strict();
export const taskSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(250),
  segmentId: z.string().min(1).max(100),
  subchapter: z.string().max(150),
  status: z.number().int().min(0).max(4),
  completedAt: date.default(''),
  completedTime: time.default(''),
  due: date,
  note: z.string().max(2000),
  url: z.string().max(2000).refine(value => value === '' || z.string().url().safeParse(value).success, 'URL tidak valid'),
}).strict();
export const journalSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(160),
  date: date.refine(value => value !== ''),
  mood: z.enum(['tenang', 'lelah', 'cemas', 'bangga', 'semangat']),
  content: z.string().trim().min(1).max(12000),
  sealed: z.boolean(),
}).strict();
export const sessionSchema = z.object({id:z.number().int().min(1).max(50),advisor:z.string().max(80).default(''),date,material:z.string().max(2000),feedback:z.string().max(4000),followup:z.string().max(4000),prepared:z.boolean(),met:z.boolean(),followed:z.boolean()}).strict();
export const logSchema = z.object({
  id:z.string().min(1).max(100),
  date:date.refine(value=>value!==''),
  time:time.default(''),
  category:z.string().trim().min(1).max(80),
  title:z.string().trim().max(160).default(''),
  text:z.string().trim().min(1).max(2000),
  duration:z.string().max(40).default(''),
  location:z.string().max(80).default(''),
  focus:z.string().max(100).default(''),
  progress:z.number().min(0).max(100).default(0),
  completedTasks:z.number().int().min(0).max(999).default(0),
  stress:z.number().min(0).max(100).default(0),
}).strict();
export const resourceSchema = z.object({id:z.string().min(1).max(100),label:z.string().trim().min(1).max(100),type:z.enum(['Drive','Docs','Sheets','Lainnya']),url:z.string().url().max(2000)}).strict();
export const trackerSchema = z.object({
  name:z.string().trim().min(1).max(80),project:z.string().trim().min(1).max(160),program:z.string().max(120).default('Film dan Televisi'),studentId:z.string().max(80).default(''),thesisTitle:z.string().max(300).default(''),profilePhoto:z.string().max(750000).refine(value=>value===''||/^data:image\/(jpeg|png|webp);base64,/.test(value),'Foto profil tidak valid').default(''),advisors:z.array(z.string().trim().min(1).max(80)).min(1).max(8).default(['Dosen Pembimbing 1','Dosen Pembimbing 2']),writingWeight:z.number().int().min(0).max(100),reminderDays:z.number().int().min(0).max(30).default(3),resources:z.array(resourceSchema).max(50).default([]),segments:z.array(segmentSchema).min(1).max(30),tasks:z.array(taskSchema).max(2000),sessions:z.array(sessionSchema).max(50),logs:z.array(logSchema).max(5000),journals:z.array(journalSchema).max(3000).default([]),
}).strict().superRefine((data, context) => {
  for (const [field, items] of [['segments',data.segments],['tasks',data.tasks],['sessions',data.sessions],['logs',data.logs],['resources',data.resources],['journals',data.journals]] as const) {
    if (new Set(items.map(item=>item.id)).size !== items.length) context.addIssue({code:'custom',message:'ID harus unik',path:[field]});
  }
  const segmentIds = new Set(data.segments.map(segment=>segment.id));
  data.tasks.forEach((task,index)=>{if(!segmentIds.has(task.segmentId))context.addIssue({code:'custom',message:'Segmen tugas tidak ditemukan',path:['tasks',index,'segmentId']});});
});

export type Segment = z.infer<typeof segmentSchema>;
export type SegmentColor = Segment['color'];
export type Task = z.infer<typeof taskSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Log = z.infer<typeof logSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Journal = z.infer<typeof journalSchema>;
export type TrackerData = z.infer<typeof trackerSchema>;
export type Snapshot = {data:TrackerData;revision:number;updatedAt:string};

export const statuses = ['Belum mulai','Mulai dikerjakan','Draf awal','Revisi / finalisasi','Selesai'];
export const segmentColorLabels: Record<SegmentColor,string> = {lime:'Lime',mint:'Mint',blue:'Biru',violet:'Ungu',peach:'Peach',rose:'Rose'};
export const defaultSegments = (): Segment[] => [
  {id:'bab-1',name:'Bab 1',color:'lime'},
  {id:'bab-2',name:'Bab 2',color:'mint'},
  {id:'bab-3',name:'Bab 3',color:'blue'},
  {id:'bab-4',name:'Bab 4',color:'violet'},
  {id:'bab-5',name:'Bab 5',color:'peach'},
];

export function initialTracker():TrackerData{return {name:'Pengguna Skripsync',project:'Tugas Akhir',program:'',studentId:'',thesisTitle:'',profilePhoto:'',advisors:['Dosen Pembimbing 1','Dosen Pembimbing 2'],writingWeight:80,reminderDays:3,resources:[],segments:defaultSegments(),tasks:[],sessions:[],logs:[],journals:[]};}

export function demoTracker():TrackerData{
  const shiftedDate=(offset:number)=>{const value=new Date(localDate()+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+offset);return value.toISOString().slice(0,10);};
  const today=shiftedDate(0);
  return {
    name:'Alya Pratama',
    project:'Skripsi Penciptaan Film',
    program:'Film dan Televisi',
    studentId:'2210123401',
    thesisTitle:'Visualisasi Intensi Tokoh melalui Pergerakan Kamera dalam Film Fiksi',
    profilePhoto:'',
    advisors:['Dr. Raka Adinata, M.Sn.','Maya Larasati, M.Sn.'],
    writingWeight:80,
    reminderDays:3,
    resources:[
      {id:'demo-drive',label:'Folder Utama Skripsi',type:'Drive',url:'https://drive.google.com/'},
      {id:'demo-docs',label:'Draft Naskah & Treatment',type:'Docs',url:'https://docs.google.com/'},
      {id:'demo-sheets',label:'Timeline Produksi',type:'Sheets',url:'https://sheets.google.com/'},
    ],
    segments:[
      {id:'riset',name:'Riset & Konsep',color:'lime'},
      {id:'penulisan',name:'Penulisan',color:'mint'},
      {id:'produksi',name:'Pra-Produksi',color:'blue'},
      {id:'revisi',name:'Revisi',color:'violet'},
      {id:'sidang',name:'Persiapan Sidang',color:'peach'},
    ],
    tasks:[
      {id:'demo-task-1',name:'Tulis latar belakang penciptaan',segmentId:'penulisan',subchapter:'Bab 1',status:4,completedAt:today,completedTime:'09:15',due:shiftedDate(-1),note:'Latar belakang sudah dirapikan sesuai catatan dosen.',url:''},
      {id:'demo-task-2',name:'Validasi rumusan masalah',segmentId:'riset',subchapter:'Fundamental',status:4,completedAt:today,completedTime:'11:40',due:today,note:'Rumusan masalah sudah lebih spesifik.',url:''},
      {id:'demo-task-3',name:'Lengkapi teori tracking shot',segmentId:'penulisan',subchapter:'Bab 2',status:3,completedAt:'',completedTime:'',due:shiftedDate(2),note:'Tambahkan dua referensi jurnal terbaru.',url:''},
      {id:'demo-task-4',name:'Breakdown intensi setiap adegan',segmentId:'riset',subchapter:'Analisis Naskah',status:2,completedAt:'',completedTime:'',due:shiftedDate(4),note:'Fokus pada perubahan tensi tokoh utama.',url:''},
      {id:'demo-task-5',name:'Susun moodboard visual film',segmentId:'produksi',subchapter:'Look & Feel',status:1,completedAt:'',completedTime:'',due:shiftedDate(7),note:'Kumpulkan referensi warna, lensa, dan lighting.',url:''},
      {id:'demo-task-6',name:'Buat shot list versi pertama',segmentId:'produksi',subchapter:'Sinematografi',status:0,completedAt:'',completedTime:'',due:shiftedDate(10),note:'Urutkan berdasarkan lokasi dan kebutuhan alat.',url:''},
      {id:'demo-task-7',name:'Revisi pembahasan Bab 2',segmentId:'revisi',subchapter:'Catatan Bimbingan',status:3,completedAt:'',completedTime:'',due:shiftedDate(1),note:'Perjelas hubungan teori dengan konsep karya.',url:''},
      {id:'demo-task-8',name:'Siapkan presentasi sidang',segmentId:'sidang',subchapter:'Deck',status:0,completedAt:'',completedTime:'',due:shiftedDate(21),note:'Ringkas proses penciptaan dalam 12 slide.',url:''},
    ],
    sessions:[
      {id:1,advisor:'Dr. Raka Adinata, M.Sn.',date:shiftedDate(-6),material:'Bab 1 dan rumusan masalah',feedback:'Pertajam alasan pemilihan tracking shot.',followup:'Revisi latar belakang dan rumusan masalah.',prepared:true,met:true,followed:true},
      {id:2,advisor:'Maya Larasati, M.Sn.',date:shiftedDate(3),material:'Teori sinematografi dan breakdown adegan',feedback:'',followup:'Lengkapi matriks intensi tokoh.',prepared:true,met:true,followed:false},
    ],
    logs:[
      {id:'demo-log-1',date:today,time:'13:20',category:'Penulisan',title:'Deep work Bab 2',text:'Merapikan teori tracking shot dan menghubungkannya dengan intensi tokoh utama.',duration:'2 jam 15 menit',location:'Perpustakaan kampus',focus:'Pelan-pelan asal konsisten',progress:54,completedTasks:2,stress:25},
      {id:'demo-log-2',date:shiftedDate(-2),time:'16:10',category:'Riset & Konsep',title:'Breakdown naskah',text:'Menandai perubahan emosi dan tujuan tokoh pada delapan adegan utama.',duration:'1 jam 40 menit',location:'Studio kampus',focus:'Cari benang merah setiap adegan',progress:48,completedTasks:1,stress:35},
      {id:'demo-log-3',date:shiftedDate(-5),time:'10:30',category:'Bimbingan',title:'Bimbingan konsep visual',text:'Mendiskusikan penggunaan pergerakan kamera untuk memperkuat tensi dramatik.',duration:'55 menit',location:'Kampus',focus:'Catat setiap arahan dosen',progress:42,completedTasks:0,stress:20},
    ],
    journals:[
      {id:'demo-journal-1',title:'Akhirnya menemukan arahnya',date:today,mood:'bangga',content:'Hari ini konsep visual mulai terasa menyatu dengan cerita. Masih banyak yang harus diselesaikan, tetapi arah filmnya sudah jauh lebih jelas.',sealed:false},
      {id:'demo-journal-2',title:'Pelan-pelan tetap bergerak',date:shiftedDate(-3),mood:'tenang',content:'Tidak semua target selesai hari ini. Aku memilih merapikan satu bagian dengan benar daripada memaksakan semuanya sekaligus.',sealed:false},
      {id:'demo-journal-3',title:'Catatan setelah bimbingan',date:shiftedDate(-8),mood:'semangat',content:'Masukan dosen membuatku sadar bahwa pergerakan kamera harus lahir dari kebutuhan tokoh, bukan sekadar membuat visual terlihat dinamis.',sealed:false},
    ],
  };
}

export function migrateTracker(input: unknown): TrackerData {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return trackerSchema.parse(input);
  const raw = input as Record<string, unknown>;
  const segments = Array.isArray(raw.segments) && raw.segments.length ? raw.segments : defaultSegments();
  const validSegmentIds = new Set(segments.flatMap(segment => segment && typeof segment === 'object' && typeof (segment as {id?:unknown}).id === 'string' ? [(segment as {id:string}).id] : []));
  const fallbackSegmentId = validSegmentIds.values().next().value ?? 'bab-1';
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    const legacy = item as Record<string, unknown>;
    const legacyChapter = typeof legacy.chapter === 'number' ? legacy.chapter : 1;
    const requestedSegment = typeof legacy.segmentId === 'string' ? legacy.segmentId : `bab-${legacyChapter}`;
    const {chapter: _chapter, ...task} = legacy;
    void _chapter;
    return {...task,segmentId:validSegmentIds.has(requestedSegment)?requestedSegment:fallbackSegmentId,url:typeof legacy.url==='string'?legacy.url:''};
  }) : [];
  return trackerSchema.parse({...raw,segments,tasks,sessions:Array.isArray(raw.sessions)?raw.sessions:[],journals:Array.isArray(raw.journals)?raw.journals:[]});
}

export function sessionProgress(session:Session){return (session.prepared?30:0)+(session.met?40:0)+(session.followed?30:0);}
export function metrics(data:TrackerData){
  const segments=data.segments.map(segment=>{const tasks=data.tasks.filter(task=>task.segmentId===segment.id);return {...segment,count:tasks.length,done:tasks.filter(task=>task.status===4).length,progress:tasks.length?tasks.reduce((value,task)=>value+task.status*25,0)/tasks.length:0};});
  const writing=data.tasks.length?data.tasks.reduce((value,task)=>value+task.status*25,0)/data.tasks.length:0;
  const consultation=data.sessions.length?data.sessions.reduce((value,session)=>value+sessionProgress(session),0)/data.sessions.length:0;
  return {segments,writing,consultation,total:(writing*data.writingWeight+consultation*(100-data.writingWeight))/100,done:data.tasks.filter(task=>task.status===4).length,completedToday:data.tasks.filter(task=>task.status===4&&task.completedAt===localDate()).length,started:data.tasks.filter(task=>task.status>0&&task.status<4).length,consultDone:data.sessions.filter(session=>sessionProgress(session)===100).length};
}
export function localDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function localTime(){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());}
export function formatDate(value:string){return value?new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):'Belum dijadwalkan';}
export function weeklyLogs(logs:Log[]){const now=new Date(localDate()+'T12:00:00Z');now.setUTCDate(now.getUTCDate()-(now.getUTCDay()+6)%7);return Array.from({length:6},(_,index)=>{const start=new Date(now);start.setUTCDate(start.getUTCDate()-(5-index)*7);const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);const from=start.toISOString().slice(0,10),to=end.toISOString().slice(0,10);return {label:new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',timeZone:'UTC'}).format(start),count:logs.filter(log=>log.date>=from&&log.date<to).length};});}
