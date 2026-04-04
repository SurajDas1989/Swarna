"use client";

import { useState } from "react";
import { Tag, X, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CouponInputProps {
  appliedCode?: string;
  onApply: (code: string) => Promise<{ valid: boolean; error?: string }>;
  onRemove: () => void;
  availableDiscount?: { code: string; percent: number } | null;
}

export function CouponInput({ appliedCode, onApply, onRemove, availableDiscount }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async (codeOverride?: string) => {
    const finalCode = (codeOverride || code).trim().toUpperCase();
    if (!finalCode) {
      setError("Please enter a coupon code.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await onApply(finalCode);
    if (!result.valid) {
      setError(result.error || "Invalid coupon code.");
    }
    setLoading(false);
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            Coupon <Badge variant="secondary" className="bg-green-100 text-green-800">{appliedCode}</Badge> applied!
          </span>
        </div>
        <button onClick={onRemove} className="text-green-600 hover:text-green-800 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {availableDiscount && (
        <button
          type="button"
          onClick={() => handleApply(availableDiscount.code)}
          className="flex w-full items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm transition-colors hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>
            Apply <span className="font-semibold text-primary">{availableDiscount.code}</span> for {availableDiscount.percent}% off
          </span>
        </button>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => handleApply()}
          disabled={loading}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
