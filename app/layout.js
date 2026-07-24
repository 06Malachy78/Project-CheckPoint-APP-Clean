import './globals.css'; // This is the magic line
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/server';
import { Poppins } from 'next/font/google';

export const metadata = {
  metadataBase: new URL('https://checkpoint-hub.com'),
  title: {
    default: 'Checkpoint Hub',
    template: '%s | Checkpoint Hub',
  },
  description: 'Discover, track, and review games with Checkpoint Hub.',
  keywords: ['Checkpoint Hub', 'game reviews', 'video games', 'gaming community', 'game discovery'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Checkpoint Hub',
    description: 'Discover, track, and review games with Checkpoint Hub.',
    url: 'https://checkpoint-hub.com',
    siteName: 'Checkpoint Hub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Checkpoint Hub',
    description: 'Discover, track, and review games with Checkpoint Hub.',
  },
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

import Head from 'next/head';


    <>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>
    </>


export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={`${poppins.className} bg-zinc-950 text-zinc-100 antialiased min-h-screen flex flex-col`}>
        <Navbar initialUser={user} />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
