import './globals.css'; // This is the magic line
import Footer from '@/components/Footer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}