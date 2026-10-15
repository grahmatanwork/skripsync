import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
export const metadata: Metadata = {
 title:'Skripsync · Your Thesis Tracker',
 description:'Your thesis tracker untuk tugas, bimbingan, kalender, arsip, jurnal, dan progres skripsi.',
 manifest:'/manifest.webmanifest',
 appleWebApp:{capable:true,title:'Skripsync',statusBarStyle:'default'},
 icons:{icon:{url:'/favicon.png?v=5',sizes:'96x96',type:'image/png'},shortcut:'/favicon.png?v=5',apple:'/skripsync-icon-color.png'},
};
export const viewport: Viewport={themeColor:'#123e30'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="id"><body>{children}</body></html>;}
