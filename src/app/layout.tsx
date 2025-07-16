// src/app/layout.tsx

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
// Import the AuthProvider here
import { AuthProvider } from "./(main)/components/AuthProvider/AuthProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--plus-jakarta-sans',
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brankas Kita",
  description: "Digital Safe Rental System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={plusJakartaSans.className} suppressHydrationWarning>
        {/* By placing the AuthProvider here, it wraps the entire application,
            including both the main site and the admin panel. */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}