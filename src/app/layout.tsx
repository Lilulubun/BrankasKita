import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--plus-jakarta-sans',
  subsets: ["latin"],
  weight: ['500', '600', '700', '800'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Brankas Kita",
  description: "Digital Safe Rental System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plusJakartaSans.className} suppressHydrationWarning>
          <Navbar />
          {children}
          <Footer />
      </body>
    </html>
  );
}
