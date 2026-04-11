"use client";

import { useState, useEffect } from "react";
import { Truck, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useShipping } from "@/context/ShippingContext";

function formatEstimateRange(startIso?: string, endIso?: string) {
    if (!startIso || !endIso) return null;

    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    const weekdayFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
    const endFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });

    return `Estimated by ${weekdayFormatter.format(start)}-${endFormatter.format(end)}`;
}

export function PincodeEstimator({ productWeightKg }: { productWeightKg?: number }) {
    const { pincode, setPincode, estimationData, setEstimationData } = useShipping();
    const [inputValue, setInputValue] = useState(pincode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync input with global pincode if it changes externally
    useEffect(() => {
        setInputValue(pincode);
    }, [pincode]);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!/^\d{6}$/.test(inputValue)) {
            setError("Please enter a valid 6-digit Pincode.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const normalizedWeightKg = Number.isFinite(productWeightKg)
                ? Math.min(Math.max(productWeightKg as number, 0.1), 5)
                : 0.5;
            const params = new URLSearchParams({
                pincode: inputValue,
                cod: "1",
                weightKg: normalizedWeightKg.toString(),
            });

            const res = await fetch(`/api/shiprocket/estimate?${params.toString()}`);
            const data = await res.json();
            
            if (!res.ok || data.error) {
                // Handle the "not configured" error gracefully for the user
                if (data.error?.includes("configured")) {
                    setError("Shipping estimates are temporarily unavailable. Please try again later.");
                } else {
                    setError(data.error || "Delivery not available to this pincode.");
                }
                setEstimationData(null);
            } else {
                setEstimationData(data);
                setPincode(inputValue);
            }
        } catch {
            setError("Failed to fetch estimate.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="my-6 border-t border-b border-gray-100 py-6 dark:border-white/5">
            <div className="flex items-center gap-2 mb-4">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium tracking-tight uppercase text-gray-500 dark:text-gray-400">
                    Delivery Availability
                </span>
            </div>
            
            <form onSubmit={handleCheck} className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter Pincode"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value.replace(/\D/g, ""));
                            setError(null);
                        }}
                        className="w-full h-11 bg-transparent border-b border-gray-200 pl-9 pr-3 text-sm focus:border-primary focus:outline-none transition-colors dark:border-white/10"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || inputValue.length !== 6}
                    className="px-6 h-11 text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-900 transition-all disabled:opacity-30 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Check"}
                </button>
            </form>

            <div className="min-h-[2.5rem] mt-3">
                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                    </div>
                )}

                {estimationData && !error && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg dark:bg-white/5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">
                                {formatEstimateRange(estimationData.etdStart, estimationData.etdEnd) ||
                                    `Delivered by ${new Date(estimationData.etd).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
