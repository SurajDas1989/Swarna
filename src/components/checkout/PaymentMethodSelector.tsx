"use client";

import { CreditCard, Wallet, Banknote, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type PaymentMethod = "credit-card" | "upi" | "cod";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  prepaidDiscountPercent?: number;
}

const methods = [
  {
    id: "credit-card" as const,
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay",
    icon: CreditCard,
    prepaid: true,
  },
  {
    id: "upi" as const,
    label: "UPI",
    description: "Google Pay, PhonePe, Paytm",
    icon: Smartphone,
    prepaid: true,
  },
  {
    id: "cod" as const,
    label: "Cash on Delivery",
    description: "Pay when you receive",
    icon: Banknote,
    prepaid: false,
  },
];

export function PaymentMethodSelector({
  selected,
  onChange,
  prepaidDiscountPercent = 5,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Payment Method</h3>
      <div className="space-y-2">
        {methods.map((method) => (
          <Card
            key={method.id}
            className={cn(
              "cursor-pointer transition-all",
              selected === method.id
                ? "border-primary ring-1 ring-primary/30 shadow-md"
                : "border-border hover:border-primary/40"
            )}
            onClick={() => onChange(method.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  selected === method.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <method.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{method.label}</span>
                  {method.prepaid && (
                    <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                      Save {prepaidDiscountPercent}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-colors",
                  selected === method.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selected === method.id && (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
