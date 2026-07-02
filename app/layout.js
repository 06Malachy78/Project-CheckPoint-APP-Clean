import './globals.css'; // This is the magic line
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/server';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

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
