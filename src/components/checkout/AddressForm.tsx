"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const addressSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    addressLine1: z.string().min(5, "Address is too short"),
    addressLine2: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "Please select a state"),
    zipCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
    addressType: z.enum(["Home", "Work", "Other"]),
    deliveryInstructions: z.string().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
    defaultValues?: Partial<AddressFormValues>;
    onSubmit: (values: AddressFormValues) => void;
    isSubmitting?: boolean;
}

const addressTypes = [
    { value: "Home" as const, label: "Home", icon: Home },
    { value: "Work" as const, label: "Work", icon: Building2 },
    { value: "Other" as const, label: "Other", icon: MapPin },
];

export function AddressForm({ defaultValues, onSubmit, isSubmitting }: AddressFormProps) {
    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            addressLine1: "",
            addressLine2: "",
            landmark: "",
            city: "",
            state: "",
            zipCode: "",
            addressType: "Home",
            deliveryInstructions: "",
            ...defaultValues,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Name and Email */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Phone */}
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                                <div className="flex">
                                    <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                                        +91
                                    </span>
                                    <Input
                                        className="rounded-l-none"
                                        placeholder="9876543210"
                                        maxLength={10}
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Address type */}
                <FormField
                    control={form.control}
                    name="addressType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address Type</FormLabel>
                            <div className="flex gap-2">
                                {addressTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => field.onChange(type.value)}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                                            field.value === type.value
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-background text-muted-foreground hover:border-primary/40"
                                        )}
                                    >
                                        <type.icon className="h-3.5 w-3.5" />
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Address lines */}
                <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address Line 1 *</FormLabel>
                            <FormControl>
                                <Input placeholder="House no., Building, Street" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                                <Input placeholder="Area, Colony (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="landmark"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Landmark</FormLabel>
                            <FormControl>
                                <Input placeholder="Near temple, school, etc. (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Mumbai" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select state" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {INDIAN_STATES.map((state) => (
                                            <SelectItem key={state} value={state}>
                                                {state}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pincode *</FormLabel>
                                <FormControl>
                                    <Input placeholder="400001" maxLength={6} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Delivery instructions */}
                <FormField
                    control={form.control}
                    name="deliveryInstructions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Delivery Instructions</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Any special instructions for delivery (optional)"
                                    className="resize-none"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full text-base font-semibold"
                    size="lg"
                    disabled={isSubmitting}
                >
                    Continue to Payment
                </Button>
            </form>
        </Form>
    );
}
