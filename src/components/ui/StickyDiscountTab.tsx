"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";

const DiscountModal = dynamic(() => import('./DiscountModal').then((mod) => mod.DiscountModal), {
  ssr: false,
});

export function StickyDiscountTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const { user, loading } = useAuth(); // Get user auth state

  // We delay rendering slightly to avoid hydration mismatch with localStorage
  useEffect(() => {
    // Check if they previously claimed it
    const claimed = localStorage.getItem("discountModalClaimed");
    
    // Only show if not loading, no user is logged in, and they haven't claimed it yet
    if (!loading && !user && claimed !== "true") {
        setShouldShow(true);
    } else {
        setShouldShow(false);
    }
  }, [user, loading]);

  if (!shouldShow) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 -translate-x-[calc(100%-2.5rem)] hover:-translate-x-[calc(100%-3rem)] transition-transform duration-300 z-50 bg-primary hover:bg-[#b8962e] text-white shadow-[4px_0_15px_-3px_rgba(0,0,0,0.3)] rounded-b-xl py-2 px-6 flex items-center justify-center -rotate-90 origin-bottom-right group cursor-pointer"
        aria-label="Get 10% OFF"
      >
        <span className="text-[13px] md:text-sm font-bold tracking-widest uppercase items-center flex gap-2 whitespace-nowrap">
           <span className="inline-block shrink-0">✨</span> Get 10% OFF
        </span>
      </button>

      <DiscountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
