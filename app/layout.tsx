import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title:'Skripsync',
 description:'Workspace skripsi untuk tugas, bimbingan, kalender, arsip, pengingat, dan assistant.',
 manifest:'/manifest.webmanifest',
 appleWebApp:{capable:true,title:'Skripsync',statusBarStyle:'default'},
 icons:{icon:'/favicon.svg',shortcut:'/favicon.svg',apple:'/icon-192.png'},
};
export const viewport: Viewport={themeColor:'#123e30'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="id"><body>{children}</body></html>;}
