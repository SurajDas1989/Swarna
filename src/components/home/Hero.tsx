"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
    const [isMobile, setIsMobile] = useState(false);
    const { scrollY } = useScroll();
    const mobileParallaxY = useTransform(scrollY, [0, 600], [0, 120]);

    useEffect(() => {
        const updateViewport = () => setIsMobile(window.innerWidth < 768);
        updateViewport();
        window.addEventListener("resize", updateViewport);
        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    const scrollToProducts = () => {
        const el = document.getElementById("products");
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <section
            id="home"
            className="relative overflow-hidden py-24 text-center text-white"
        >
            <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url('/hero-mobile.jpeg')`,
                    y: isMobile ? mobileParallaxY : 0,
                    scale: 1.08,
                }}
                initial={{ scale: 1.12, opacity: 0.9 }}
                animate={{ scale: 1.08, opacity: 1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-black/55" />

            <div className="container relative z-10 mx-auto px-4">
                <motion.h1
                    className="mb-6 text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                >
                    Discover Timeless Elegance
                </motion.h1>

                <motion.p
                    className="mx-auto mb-10 max-w-2xl text-lg font-light opacity-90 sm:text-xl md:text-2xl"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.22 }}
                >
                    Premium Artificial Jewellery Collection for Every Occasion
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.34 }}
                >
                    <Button
                        onClick={scrollToProducts}
                        size="lg"
                        className="bg-primary px-10 py-6 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-primary-dark hover:shadow-lg"
                    >
                        Shop Now
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
