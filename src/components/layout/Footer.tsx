export function Footer() {
    return (
        <footer className="bg-foreground dark:bg-[#111] text-white pt-12 pb-4">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 className="text-primary font-bold text-lg mb-4">About Swarna</h3>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            Your destination for premium artificial jewellery. We offer exquisite designs for every occasion
                            at affordable prices.
                        </p>
                        <div className="flex gap-4 mt-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl hover:bg-primary transition-colors">📘</a>
                            <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl hover:bg-primary transition-colors">📷</a>
                            <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl hover:bg-primary transition-colors">🐦</a>
                            <a href="#" className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl hover:bg-primary transition-colors">📌</a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-primary font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><a href="/#home" className="text-gray-300 hover:text-primary transition-colors text-sm">Home</a></li>
                            <li><a href="/#products" className="text-gray-300 hover:text-primary transition-colors text-sm">Shop</a></li>
                            <li><a href="/size-guide" className="text-gray-300 hover:text-primary transition-colors text-sm">Size Guide</a></li>
                            <li><a href="/#categories" className="text-gray-300 hover:text-primary transition-colors text-sm">Categories</a></li>
                            <li><a href="/#our-story" className="text-gray-300 hover:text-primary transition-colors text-sm">Our Story</a></li>
                            <li><a href="/#contact" className="text-gray-300 hover:text-primary transition-colors text-sm">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-primary font-bold text-lg mb-4">Customer Service</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-300 hover:text-primary transition-colors text-sm">Shipping Policy</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-primary transition-colors text-sm">Return & Exchange</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-primary transition-colors text-sm">Terms & Conditions</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-primary transition-colors text-sm">Privacy Policy</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-primary transition-colors text-sm">FAQ</a></li>
                        </ul>
                    </div>

                    <div id="contact">
                        <h3 className="text-primary font-bold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-start gap-2"><span>📍</span> Thakurnagar, West Bengal</li>
                            <li className="flex items-start gap-2"><span>📧</span> info@swarnacollection.in</li>
                            <li className="flex items-start gap-2"><span>📞</span> +91 93269 01595</li>
                            <li className="flex items-start gap-2"><span>⏰</span> Mon to Sat: 10 AM - 7 PM</li>
                        </ul>
                    </div>
                </div>

                <div className="text-center pt-8 border-t border-white/10 text-sm text-gray-400">
                    <p>&copy; 2026 Swarna. All rights reserved. Crafted with 💛 in India</p>
                </div>
            </div>
        </footer>
    );
}
