"use client";

import { useState } from "react";
import { Truck, MapPin, Loader2 } from "lucide-react";

export function PincodeEstimator() {
    const [pincode, setPincode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        etd?: string;
        estimatedDays?: number;
        courierName?: string;
        error?: string;
    } | null>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!/^\d{6}$/.test(pincode)) {
            setResult({ error: "Please enter a valid 6-digit Pincode." });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch(`/api/shiprocket/estimate?pincode=${pincode}`);
            const data = await res.json();
            
            if (!res.ok || data.error) {
                setResult({ error: data.error || "Delivery not available to this pincode." });
            } else {
                setResult(data);
            }
        } catch (error) {
            setResult({ error: "Failed to fetch estimate." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Truck className="h-4 w-4 text-indigo-600" />
                Check Delivery Estimate
            </h4>
            
            <form onSubmit={handleCheck} className="mt-3 flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || pincode.length !== 6}
                    className="flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                </button>
            </form>

            {result && (
                <div className="mt-3 text-sm">
                    {result.error ? (
                        <p className="font-medium text-red-600">{result.error}</p>
                    ) : (
                        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-2.5 text-emerald-800">
                            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <div>
                                <p className="font-semibold">
                                    Estimated delivery by {result.etd ? new Date(result.etd).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : `${result.estimatedDays} days`}
                                </p>
                                {result.courierName && (
                                    <p className="text-xs text-emerald-600 mt-0.5">via {result.courierName}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
