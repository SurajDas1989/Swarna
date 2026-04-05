"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme-preference";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value: string | null): value is Theme {
    return value === "light" || value === "dark" || value === "system";
}

function getStoredTheme(): Theme {
    if (typeof window === "undefined") {
        return "light";
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(storedTheme) ? storedTheme : "light";
}

function getSystemTheme(): ResolvedTheme {
    return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
    return theme === "system" ? getSystemTheme() : theme;
}

function applyThemeToDocument(theme: ResolvedTheme) {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
}

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
        if (typeof window === "undefined") {
            return "light";
        }

        const initialTheme = getStoredTheme();
        if (initialTheme === "system") {
            return document.documentElement.classList.contains("dark") ? "dark" : getSystemTheme();
        }

        return initialTheme;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(MEDIA_QUERY);

        const syncTheme = () => {
            const nextResolvedTheme = resolveTheme(theme);
            setResolvedTheme(nextResolvedTheme);
            applyThemeToDocument(nextResolvedTheme);

            if (theme === "system") {
                window.localStorage.removeItem(THEME_STORAGE_KEY);
            } else {
                window.localStorage.setItem(THEME_STORAGE_KEY, theme);
            }
        };

        syncTheme();

        const handleSystemThemeChange = () => {
            if (theme === "system") {
                syncTheme();
            }
        };

        mediaQuery.addEventListener("change", handleSystemThemeChange);
        return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => {
            const currentResolvedTheme = prev === "system" ? resolvedTheme : prev;
            return currentResolvedTheme === "dark" ? "light" : "dark";
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
