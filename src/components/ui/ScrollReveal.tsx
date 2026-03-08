"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    duration?: number;
}

export function ScrollReveal({
    children,
    className = "",
    delay = 0,
    direction = "up",
    duration = 0.6
}: ScrollRevealProps) {
    const directionOffset = 40;

    const hiddenState = {
        opacity: 0,
        y: direction === "up" ? directionOffset : direction === "down" ? -directionOffset : 0,
        x: direction === "left" ? directionOffset : direction === "right" ? -directionOffset : 0,
    };

    return (
        <motion.div
            initial={hiddenState}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: duration,
                delay: delay,
                ease: [0.21, 0.47, 0.32, 0.98], // cubic-bezier for a smooth, premium ease-out
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
