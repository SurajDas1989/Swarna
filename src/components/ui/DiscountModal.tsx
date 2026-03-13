"use client";

import { useState, useEffect, FormEvent } from "react";
import { X, Loader2, Check, Copy } from "lucide-react";
import toast from 'react-hot-toast';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiscountModal({ isOpen, onClose }: DiscountModalProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  const handleDismiss = () => {
    if (!isSuccess) {
       // Only "dismiss" if they didn't succeed, preventing the tab from returning too soon
       localStorage.setItem("discountModalDismissedAt", Date.now().toString());
    }
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      toast.error("Please enter a valid phone number (at least 10 digits).");
      return;
    }


    setIsLoading(true);

    try {
      const res = await fetch('/api/discount/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate code.");
      }

      setDiscountCode(data.code);
      setIsSuccess(true);
      if (data.message) {
         toast.success(data.message);
      }
      
      // Store that they claimed it so we don't bother them again.
      localStorage.setItem("discountModalClaimed", "true");
      // Hide the tab completely for a long time since they got the code
      localStorage.setItem("discountModalDismissedAt", (Date.now() + (365 * 24 * 60 * 60 * 1000)).toString()); 

    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleDismiss}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-[90vw] md:w-[440px] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Image Area with Overlay */}
        <div className="relative h-48 md:h-56 bg-zinc-200">
           {/* Replace this with an actual jewelry image if available. Using a subtle pattern/gradient as placeholder for premium feel */}
           <div className="absolute inset-0 bg-[linear-gradient(45deg,#d4af37_0%,#f0e4c3_100%)] dark:bg-[linear-gradient(45deg,#2a2411_0%,#4a4022_100%)] opacity-80" />
           <div className="absolute inset-0 bg-black/20" /> {/* Dimmer for text readability */}
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white drop-shadow-md">
               <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                 Get 10% OFF
               </h2>
               {!isSuccess && (
                 <p className="text-sm md:text-base font-medium opacity-90">
                   Sign up to unlock your instant discount!
                 </p>
               )}
           </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="discount-email" className="sr-only">Email Address</label>
                <input
                  id="discount-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="discount-phone" className="sr-only">Phone Number</label>
                <input
                  id="discount-phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-[#b8962e] text-white font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Claim My 10% Discount"
                )}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-center text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-2 transition-colors"
              >
                No thanks, I'll pay full price
              </button>

              <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
                By signing up, you agree to receive email marketing. You can unsubscribe at any time. Offer valid for first-time customers only.
              </p>
            </form>
          ) : (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
               </div>
               
               <h3 className="text-xl font-bold text-foreground mb-2">Your Code is Ready!</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                 Use the code below during checkout to apply your 10% discount.
               </p>

               <div className="relative mb-6 group">
                 <div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-primary/50 rounded-xl p-4 flex items-center justify-between">
                    <span className="font-mono text-lg md:text-xl font-bold text-foreground tracking-widest break-all">
                      {discountCode}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="ml-4 p-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex-shrink-0"
                      aria-label="Copy code"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                 </div>
               </div>

               <button
                 onClick={handleDismiss}
                 className="w-full bg-foreground hover:bg-foreground/90 text-white font-medium py-3 px-6 rounded-xl transition-all"
               >
                 Start Shopping
               </button>
               
               <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-4">
                 Don't worry, an email with your code will be on its way soon (once our email service is fully active).
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
