import { z } from 'zod';

const date = z.string().refine(
  value => value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value),
  'Tanggal tidak valid',
);

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
  due: date,
  note: z.string().max(2000),
  url: z.string().max(2000).refine(value => value === '' || z.string().url().safeParse(value).success, 'URL tidak valid'),
}).strict();
export const sessionSchema = z.object({id:z.number().int().min(1).max(50),advisor:z.string().max(80).default(''),date,material:z.string().max(2000),feedback:z.string().max(4000),followup:z.string().max(4000),prepared:z.boolean(),met:z.boolean(),followed:z.boolean()}).strict();
export const logSchema = z.object({id:z.string().min(1).max(100),date:date.refine(value=>value!==''),category:z.string().trim().min(1).max(80),text:z.string().trim().min(1).max(2000)}).strict();
export const resourceSchema = z.object({id:z.string().min(1).max(100),label:z.string().trim().min(1).max(100),type:z.enum(['Drive','Docs','Sheets','Lainnya']),url:z.string().url().max(2000)}).strict();
export const trackerSchema = z.object({
  name:z.string().trim().min(1).max(80),project:z.string().trim().min(1).max(160),program:z.string().max(120).default('Film dan Televisi'),studentId:z.string().max(80).default(''),thesisTitle:z.string().max(300).default(''),profilePhoto:z.string().max(750000).refine(value=>value===''||/^data:image\/(jpeg|png|webp);base64,/.test(value),'Foto profil tidak valid').default(''),advisors:z.array(z.string().trim().min(1).max(80)).min(1).max(8).default(['Dosen Pembimbing 1','Dosen Pembimbing 2']),writingWeight:z.number().int().min(0).max(100),reminderDays:z.number().int().min(0).max(30).default(3),resources:z.array(resourceSchema).max(50).default([]),segments:z.array(segmentSchema).min(1).max(30),tasks:z.array(taskSchema).max(2000),sessions:z.array(sessionSchema).min(1).max(50),logs:z.array(logSchema).max(5000),
}).strict().superRefine((data, context) => {
  for (const [field, items] of [['segments',data.segments],['tasks',data.tasks],['sessions',data.sessions],['logs',data.logs],['resources',data.resources]] as const) {
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

export function initialTracker():TrackerData{return {name:'Pengguna Skripsync',project:'Tugas Akhir',program:'',studentId:'',thesisTitle:'',profilePhoto:'',advisors:['Dosen Pembimbing 1','Dosen Pembimbing 2'],writingWeight:80,reminderDays:3,resources:[],segments:defaultSegments(),tasks:[],sessions:[{id:1,advisor:'Dosen Pembimbing 1',date:'',material:'',feedback:'',followup:'',prepared:false,met:false,followed:false}],logs:[]};}

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
  return trackerSchema.parse({...raw,segments,tasks});
}

export function sessionProgress(session:Session){return (session.prepared?30:0)+(session.met?40:0)+(session.followed?30:0);}
export function metrics(data:TrackerData){
  const segments=data.segments.map(segment=>{const tasks=data.tasks.filter(task=>task.segmentId===segment.id);return {...segment,count:tasks.length,done:tasks.filter(task=>task.status===4).length,progress:tasks.length?tasks.reduce((value,task)=>value+task.status*25,0)/tasks.length:0};});
  const writing=data.tasks.length?data.tasks.reduce((value,task)=>value+task.status*25,0)/data.tasks.length:0;
  const consultation=data.sessions.reduce((value,session)=>value+sessionProgress(session),0)/data.sessions.length;
  return {segments,writing,consultation,total:(writing*data.writingWeight+consultation*(100-data.writingWeight))/100,done:data.tasks.filter(task=>task.status===4).length,started:data.tasks.filter(task=>task.status>0&&task.status<4).length,consultDone:data.sessions.filter(session=>sessionProgress(session)===100).length};
}
export function localDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function formatDate(value:string){return value?new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z')):'Belum dijadwalkan';}
export function weeklyLogs(logs:Log[]){const now=new Date(localDate()+'T12:00:00Z');now.setUTCDate(now.getUTCDate()-(now.getUTCDay()+6)%7);return Array.from({length:6},(_,index)=>{const start=new Date(now);start.setUTCDate(start.getUTCDate()-(5-index)*7);const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);const from=start.toISOString().slice(0,10),to=end.toISOString().slice(0,10);return {label:new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',timeZone:'UTC'}).format(start),count:logs.filter(log=>log.date>=from&&log.date<to).length};});}
