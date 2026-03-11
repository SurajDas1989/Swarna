"use client";

import React from 'react';
import { Ruler, Info, MessageCircle, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SizeGuidePage() {
    const whatsappNumber = "+919326901595";
    const whatsappHref = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent("Hi! I need help finding my perfect size.")}`;

    return (
        <div className="min-h-screen bg-background py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Size Guide</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Find your perfect fit with our comprehensive guide for rings, bangles, and necklaces.
                    </p>
                </div>

                <div className="space-y-16">
                    {/* Ring Size Section */}
                    <section id="rings" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-8 pb-2 border-b">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Ruler className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">Ring Sizes</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-xl font-semibold mb-4">International Sizing Chart</h3>
                                <div className="overflow-x-auto rounded-xl border border-border">
                                    <table className="w-full text-sm text-center">
                                        <thead className="bg-muted text-muted-foreground uppercase text-xs tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 border-b border-r">US/India Size</th>
                                                <th className="px-4 py-3 border-b border-r">Diameter (mm)</th>
                                                <th className="px-4 py-3 border-b">Circumference (mm)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { us: '5', dia: '15.7', circ: '49.3' },
                                                { us: '6', dia: '16.5', circ: '51.9' },
                                                { us: '7', dia: '17.3', circ: '54.5' },
                                                { us: '8', dia: '18.2', circ: '57.2' },
                                                { us: '9', dia: '19.0', circ: '59.8' },
                                                { us: '10', dia: '19.8', circ: '62.3' },
                                                { us: '11', dia: '20.7', circ: '65.0' },
                                                { us: '12', dia: '21.5', circ: '67.6' },
                                            ].map((row, i) => (
                                                <tr key={row.us} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                                                    <td className="px-4 py-3 border-b border-r font-medium">{row.us}</td>
                                                    <td className="px-4 py-3 border-b border-r">{row.dia}</td>
                                                    <td className="px-4 py-3 border-b">{row.circ}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-3">
                                        <Info className="h-5 w-5" />
                                        Measurement Tips
                                    </h3>
                                    <ul className="space-y-3 text-sm text-foreground/80">
                                        <li className="flex gap-2">
                                            <span className="text-primary font-bold">•</span>
                                            Measure your finger at the end of the day when it's largest.
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary font-bold">•</span>
                                            If you're between sizes, always go for the larger size.
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-primary font-bold">•</span>
                                            Wide bands fit tighter than thin ones—consider going up a half size.
                                        </li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-muted rounded-2xl">
                                    <h4 className="font-bold mb-2">How to measure:</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Wrap a string around the base of your finger, mark the point where the ends meet, and measure it against a ruler in mm. This is your circumference.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Bangle Section */}
                    <section id="bangles" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-8 pb-2 border-b">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Ruler className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">Bangles Sizing</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="order-2 lg:order-1 space-y-6">
                                <p className="text-foreground/80 leading-relaxed">
                                    Bangles are rigid, so they must be able to slide over the widest part of your hand. 
                                    Indian bangle sizes are typically denoted by two numbers (e.g., 2.4, 2.6).
                                </p>
                                <div className="p-6 bg-muted rounded-2xl border border-border">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4 text-primary" />
                                        Hand Circumference Method
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Bring your thumb and little finger together as if you are slipping on a bangle. 
                                        Measure the circumference around the widest part of your hand (the knuckles).
                                    </p>
                                </div>
                                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                    <h4 className="font-bold text-primary mb-2">Standard Indian Sizes:</h4>
                                    <p className="text-sm">2.4 is Small, 2.6 is Medium, and 2.8 is Large.</p>
                                </div>
                            </div>

                            <div className="order-1 lg:order-2">
                                <div className="overflow-x-auto rounded-xl border border-border">
                                    <table className="w-full text-sm text-center">
                                        <thead className="bg-muted text-muted-foreground uppercase text-xs tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 border-b border-r">India Size</th>
                                                <th className="px-4 py-3 border-b border-r">Inner Diameter (mm)</th>
                                                <th className="px-4 py-3 border-b">Inner Diameter (Inches)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { label: '2.2', mm: '54.0', inch: '2.125"' },
                                                { label: '2.4', mm: '57.2', inch: '2.25\"' },
                                                { label: '2.6', mm: '60.3', inch: '2.375"' },
                                                { label: '2.8', mm: '63.5', inch: '2.5"' },
                                                { label: '2.10', mm: '66.7', inch: '2.625"' },
                                            ].map((row, i) => (
                                                <tr key={row.label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                                                    <td className="px-4 py-3 border-b border-r font-bold">{row.label}</td>
                                                    <td className="px-4 py-3 border-b border-r">{row.mm}</td>
                                                    <td className="px-4 py-3 border-b font-medium">{row.inch}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Necklace Section */}
                    <section id="necklaces" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-8 pb-2 border-b">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Ruler className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground">Necklace Lengths</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { length: '14-16"', name: 'Choker', desc: 'Wraps closely around the neck.' },
                                { length: '18"', name: 'Princess', desc: 'Sits elegantly on the collarbone. Most popular length.' },
                                { length: '20-24"', name: 'Matinee', desc: 'Falls between the collarbone and the bust.' },
                                { length: '28-36"', name: 'Opera', desc: 'Reaches the bustline or just below.' },
                                { length: '36-42"', name: 'Lariat', desc: 'Falls below the bust, can be wrapped multiple times.' },
                            ].map((necklace) => (
                                <div key={necklace.name} className="p-6 border border-border rounded-2xl hover:border-primary/30 transition-colors bg-muted/5">
                                    <div className="text-primary font-bold text-lg mb-1">{necklace.name}</div>
                                    <div className="text-foreground font-semibold mb-3">{necklace.length}</div>
                                    <p className="text-sm text-muted-foreground">{necklace.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Need Help Section */}
                    <div className="mt-12 bg-foreground text-background dark:bg-muted dark:text-foreground rounded-3xl p-8 md:p-12 text-center">
                        <div className="inline-flex p-3 bg-primary/20 rounded-2xl mb-6">
                            <HelpCircle className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Still Not Sure About Your Size?</h2>
                        <p className="text-foreground/70 dark:text-muted-foreground mb-8 max-w-xl mx-auto">
                            Don't worry! Our jewelry experts are always ready to help you find the perfect fit. Connect with us on WhatsApp for live assistance.
                        </p>
                        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 h-14 px-8 rounded-full text-lg shadow-xl shadow-primary/20 transition-transform active:scale-95">
                                <MessageCircle className="h-6 w-6" />
                                Chat with Us for Size Help
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
