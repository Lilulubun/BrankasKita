// src/app/(main)/layout.tsx

import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

// This layout is now much simpler. It only contains the components
// that are specific to the main public-facing site.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}