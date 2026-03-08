"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setVisible(window.scrollY > 320);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (!visible) {
        return null;
    }

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fixed bottom-24 right-4 z-[55] flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-black/85 text-white shadow-lg backdrop-blur transition hover:bg-primary md:bottom-6 md:right-6"
        >
            <ArrowUp className="h-5 w-5" />
        </button>
    );
}
