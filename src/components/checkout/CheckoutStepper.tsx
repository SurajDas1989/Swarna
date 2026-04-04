"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStep = "cart" | "address" | "payment" | "confirmation";

const steps: { id: CheckoutStep; label: string }[] = [
    { id: "cart", label: "Cart" },
    { id: "address", label: "Address" },
    { id: "payment", label: "Payment" },
    { id: "confirmation", label: "Confirmation" },
];

interface CheckoutStepperProps {
    currentStep: CheckoutStep;
    onStepClick?: (step: CheckoutStep) => void;
}

export function CheckoutStepper({ currentStep, onStepClick }: CheckoutStepperProps) {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    return (
        <nav aria-label="Checkout progress" className="w-full py-4">
            <ol className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isClickable = isCompleted && onStepClick;

                    return (
                        <li key={step.id} className="flex flex-1 items-center last:flex-none">
                            <button
                                type="button"
                                disabled={!isClickable}
                                onClick={() => isClickable && onStepClick(step.id)}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 transition-colors",
                                    isClickable && "cursor-pointer hover:opacity-80",
                                    !isClickable && "cursor-default"
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                                        isCompleted && "border-primary bg-primary text-primary-foreground",
                                        isCurrent && "border-primary bg-background text-primary shadow-md shadow-primary/20",
                                        !isCompleted && !isCurrent && "border-muted-foreground/30 bg-muted text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                                </span>
                                <span
                                    className={cn(
                                        "text-xs font-medium",
                                        isCurrent && "text-primary",
                                        isCompleted && "text-foreground",
                                        !isCompleted && !isCurrent && "text-muted-foreground"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </button>

                            {index < steps.length - 1 && (
                                <div className="mx-2 mt-[-1rem] h-0.5 flex-1">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-colors",
                                            index < currentIndex ? "bg-primary" : "bg-muted-foreground/20"
                                        )}
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
