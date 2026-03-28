import { Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
    return (
        <footer className="border-t border-primary/15 bg-[#171717] pt-12 pb-4 text-stone-50 dark:border-white/10 dark:bg-[#101010]">
            <div className="container mx-auto px-4">
                <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Logo className="mb-6 h-10 w-auto brightness-0 invert" />
                        <p className="mb-4 text-sm leading-relaxed text-stone-300">
                            Your destination for premium artificial jewellery. We offer exquisite designs for every occasion
                            at affordable prices.
                        </p>
                        <div className="mt-4 flex gap-4">
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary hover:text-[#101010]">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary hover:text-[#101010]">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary hover:text-[#101010]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.63 7.89 6.4 9.33-.09-.79-.17-2.01.04-2.88.19-.8 1.22-5.18 1.22-5.18s-.31-.62-.31-1.54c0-1.44.84-2.52 1.88-2.52.88 0 1.31.66 1.31 1.45 0 .89-.57 2.22-.86 3.45-.24 1.03.52 1.88 1.54 1.88 1.85 0 3.27-1.95 3.27-4.76 0-2.49-1.79-4.23-4.35-4.23-2.96 0-4.7 2.22-4.7 4.5 0 .9.35 1.86.78 2.38.09.1.1.2.07.32-.09.38-.28 1.15-.32 1.31-.05.21-.18.26-.4.16-1.49-.69-2.42-2.85-2.42-4.58 0-3.73 2.71-7.15 7.8-7.15 4.09 0 7.27 2.91 7.27 6.8 0 4.07-2.56 7.34-6.11 7.34-1.2 0-2.33-.62-2.71-1.36 0 0-.59 2.25-.74 2.82-.27 1.03-1 2.32-1.48 3.1 1.31.39 2.7.61 4.14.61 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 text-lg font-bold text-primary">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><a href="/#home" className="text-sm text-stone-300 transition-colors hover:text-primary">Home</a></li>
                            <li><a href="/#products" className="text-sm text-stone-300 transition-colors hover:text-primary">Shop</a></li>
                            <li><a href="/size-guide" className="text-sm text-stone-300 transition-colors hover:text-primary">Size Guide</a></li>
                            <li><a href="/#faq" className="text-sm text-stone-300 transition-colors hover:text-primary">FAQ</a></li>
                            <li><a href="/#categories" className="text-sm text-stone-300 transition-colors hover:text-primary">Categories</a></li>
                            <li><a href="/#our-story" className="text-sm text-stone-300 transition-colors hover:text-primary">Our Story</a></li>
                            <li><a href="/#contact" className="text-sm text-stone-300 transition-colors hover:text-primary">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-lg font-bold text-primary">Customer Service</h3>
                        <ul className="space-y-2">
                            <li><a href="/shipping-policy" className="text-sm text-stone-300 transition-colors hover:text-primary">Shipping Policy</a></li>
                            <li><a href="/return-policy" className="text-sm text-stone-300 transition-colors hover:text-primary">Return & Exchange</a></li>
                            <li><a href="#" className="text-sm text-stone-300 transition-colors hover:text-primary">Terms & Conditions</a></li>
                            <li><a href="#" className="text-sm text-stone-300 transition-colors hover:text-primary">Privacy Policy</a></li>
                            <li><a href="/#faq" className="text-sm text-stone-300 transition-colors hover:text-primary">FAQ</a></li>
                        </ul>
                    </div>

                    <div id="contact">
                        <h3 className="mb-4 text-lg font-bold text-primary">Contact Us</h3>
                        <ul className="space-y-3 text-sm text-stone-300">
                            <li className="flex items-start gap-2"><span>📍</span> Thakurnagar, West Bengal</li>
                            <li className="flex items-start gap-2"><span>📧</span> info@swarnacollection.in</li>
                            <li className="flex items-start gap-2"><span>📞</span> +91 93269 01595</li>
                            <li className="flex items-start gap-2"><span>⏰</span> Mon to Sat: 10 AM - 7 PM</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 text-center text-sm text-stone-400">
                    <p>&copy; 2026 Swarna. All rights reserved. Crafted with 💛 in India</p>
                </div>
            </div>
        </footer>
    );
}
