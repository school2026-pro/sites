import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'マイ手帳 | スクールライフ完全攻略',description:'予定と振り返りをつなげる、自分専用の学校生活手帳。',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>;}
