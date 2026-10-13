import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
export const metadata: Metadata = {
 title:'Skripsync · Your Thesis Tracker',
 description:'Your thesis tracker untuk tugas, bimbingan, kalender, arsip, jurnal, dan progres skripsi.',
 manifest:'/manifest.webmanifest',
 appleWebApp:{capable:true,title:'Skripsync',statusBarStyle:'default'},
 icons:{icon:'/favicon.png',shortcut:'/favicon.png',apple:'/icon-192.png'},
};
export const viewport: Viewport={themeColor:'#123e30'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="id"><body>{children}</body></html>;}
