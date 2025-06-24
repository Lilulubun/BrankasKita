"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import BoxIcon from "./components/BoxIcons/BoxIcon";
import Link from 'next/link';
import Modal from "./components/Modal";
import { useRouter } from "next/navigation";


interface Box {
  id: string;
  box_code: string;
  status: string;
  items_type: string;
}

export default function Home() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const bookingRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBoxes();
  }, []);

  async function fetchBoxes() {
    console.log('Fetching boxes...');
    const { data, error } = await supabase
      .from('boxes')
      .select('*')
      .order('box_code');

    if (error) {
      console.error('Error fetching boxes:', error);
      return;
    }

    console.log('Fetched boxes:', data);
    setBoxes(data || []);
  }

  // Handle direct URL navigation with hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      
      if (hash) {
        const sectionId = hash.substring(1);
        const section = document.getElementById(sectionId);
        const navbar = document.querySelector('nav');
        
        if (section && navbar) {
          const navbarHeight = navbar.offsetHeight;
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }
  }, []);

  const handleBoxAvailable = (id: string) => {
    router.push(`/booking?boxId=${id}`);
  };

  const handleBoxUnavailable = () => {
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/*<TestConnection /> */}
        <div id="hero" className="flex flex-col md:flex-row items-center justify-between gap-12 bg-gray-50 shadow-2xl shadow-black-500/40 rounded-xl mt-8">
          {/* Left content */}
          <div className="flex-1 space-y-6 pl-12">
            <h1 className="text-9xl font-bold text-gray-900">
              Brankas Kita
            </h1>
            <p className="text-xl text-gray-600 pb-12">
              Digital Safe Rental System Based on Barcode and PIN Code.
            </p>
            <div className="flex gap-4">
              <Link href="/#booking"className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                Get Started
              </Link>
              <button className="px-6 py-3 bg-white text-black border border-black rounded-md hover:bg-gray-50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
          
          {/* Right content - Safe Image */}
          <div className="flex-1">
            <div className="relative w-full h-[600px]">
              <Image
                src="/safe-image.png"
                alt="Digital Safe"
                fill
                style={{ objectFit: 'contain' }}
                priority
               />
            </div>
          </div>
        </div>
      </main>
      
      {/* Box Grid Section */}
      <section id="booking" ref={bookingRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-5xl font-medium text-center mb-4">Choose Your Box</h2>
          <p className="text-center text-gray-600 mb-12">
            Black boxes are available for rent, while gray boxes are currently unavailable.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
            {boxes.map((box) => (
              <BoxIcon
                key={box.id}
                id={box.id}
                status={box.status}
                boxCode={box.box_code}
                onAvailable={handleBoxAvailable}
                onUnavailable={handleBoxUnavailable}
              />
            ))}
          </div>
        </div>
      </section>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="text-lg text-gray-800 font-semibold">Deposit box already rented.</div>
      </Modal>
    </div>
  );
}
