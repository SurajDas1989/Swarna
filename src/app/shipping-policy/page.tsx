import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShippingFaq } from '@/components/policies/ShippingFaq';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Jewellery Shipping Policy India',
  description: 'Shipping guidelines, delivery timelines, and order processing information for Swarna Collection.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shipping Policy' },
          ]}
          currentPath="/shipping-policy"
          className="mb-8"
        />

        {/* Header Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <h1 className="text-3xl md:text-5xl font-serif text-primary mb-4 text-balance">Shipping Policy – Swarna Collection</h1>
          <p className="text-muted-foreground text-lg">Premium Artificial Jewellery Delivered Safely</p>
          <div className="w-24 h-1 bg-primary/30 mx-auto mt-6 rounded-full" />
        </div>

        {/* Intro Section */}
        <Card className="p-6 md:p-8 mb-8 border-primary/10 shadow-sm md:shadow-md animate-in fade-in duration-1000">
          <p className="text-foreground/80 leading-relaxed text-center italic md:text-lg">
            At Swarna Collection, every piece is carefully packed to ensure it reaches you safely and in perfect condition. 
            Please review our shipping guidelines below.
          </p>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-10 animate-in fade-in duration-1000 delay-300">
          
          {/* Section 1: Order Processing Time */}
          <section className="space-y-4">
            <h2 className="text-2xl font-serif text-primary border-b border-primary/10 pb-2 flex items-center gap-3">
              <span className="text-xl">⏱️</span> 1. Order Processing Time
            </h2>
            <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-3">
              <p className="text-foreground/90">All confirmed orders are processed and dispatched within <strong>2–3 business days</strong> from the date of purchase.</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80 ml-4">
                <li><strong>Business days:</strong> Monday to Friday (excluding public holidays)</li>
                <li>Orders placed on weekends or holidays will be processed on the next working day</li>
                <li>During festivals, sales, or high-demand periods, dispatch timelines may extend slightly. We will notify you via WhatsApp or email wherever possible.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Delivery Timeline */}
          <section className="space-y-4">
            <h2 className="text-2xl font-serif text-primary border-b border-primary/10 pb-2 flex items-center gap-3">
              <span className="text-xl">🚚</span> 2. Delivery Timeline
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                <p className="text-foreground/90 mb-3">Once dispatched, delivery typically takes <strong>4–8 business days</strong> depending on your location.</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  <li>Delivery timelines are estimates and not guaranteed</li>
                  <li>Remote or non-metro areas may take longer</li>
                </ul>
              </div>
              <div className="bg-rose-50/50 dark:bg-rose-900/10 p-5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <h3 className="font-bold text-rose-800 dark:text-rose-400 mb-2 text-sm uppercase tracking-wider">Not liable for delays caused by:</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-foreground/80">
                  <li>Courier partner issues</li>
                  <li>Weather conditions or natural disasters</li>
                  <li>Strikes or political disruptions</li>
                  <li>Incorrect address or contact details</li>
                  <li>Any unforeseen circumstances beyond our control</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Priority Shipping */}
          <section className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl font-bold italic tracking-tighter">PRIORITY</div>
            <h2 className="text-2xl font-serif text-primary mb-4 flex items-center gap-3">
              <span className="text-xl">⚡</span> 3. Priority Shipping
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-background/80 p-4 rounded-xl border border-amber-200/50">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-2xl">✨</div>
                <div>
                  <p className="font-bold text-lg text-amber-900 dark:text-amber-400">Available at ₹99 (additional charge)</p>
                  <p className="text-sm text-foreground/70">Faster dispatch and priority handling by courier partners.</p>
                </div>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
                <li className="flex items-center gap-2 text-sm text-foreground/80"><span>📍</span> Availability depends on your PIN code</li>
                <li className="flex items-center gap-2 text-sm text-foreground/80"><span>⚠️</span> Does not guarantee same-day/next-day</li>
              </ul>
            </div>
          </section>

          {/* Section 4 & 5: Delivery Attempts & Address Accuracy */}
          <div className="grid md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h2 className="text-xl font-serif text-primary border-b border-primary/10 pb-2">4. Delivery & Coordination</h2>
              <div className="text-sm text-foreground/80 space-y-2">
                <p>Delivery will be attempted as per courier partner policies. You may receive a call or SMS before delivery.</p>
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20 text-xs">
                  <strong>Failed Delivery:</strong> If due to customer unavailability, incorrect address, or refusal, the package may be returned. <strong>Re-shipping charges will be borne by the customer.</strong>
                </div>
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-serif text-primary border-b border-primary/10 pb-2">5. Address Accuracy</h2>
              <ul className="space-y-2 text-sm text-foreground/80 list-disc list-inside">
                <li>Provide complete and correct details at checkout</li>
                <li>Not responsible for delays due to incorrect addresses</li>
                <li>Not responsible for missing/incorrect phone numbers</li>
              </ul>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-900/20 p-2 rounded border border-rose-200/50">
                ⚠️ Address modifications after shipment are not guaranteed.
              </p>
            </section>
          </div>

          {/* Section 6: Non-Serviceable Locations */}
          <section className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-serif text-primary mb-3">6. Non-Serviceable Locations</h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              If your PIN code is found non-serviceable after order placement, our team will contact you for an alternate address. 
              If no alternative is provided, the order will be cancelled.
            </p>
            <div className="p-4 bg-background/50 rounded-lg text-xs border border-primary/10 italic">
              <strong>Refund (if applicable):</strong> Processed after deducting payment gateway charges.
            </div>
          </section>

          {/* Section 7: Damaged or Tampered Packages (CRITICAL) */}
          <section className="bg-rose-50/30 dark:bg-rose-900/5 p-6 rounded-2xl border-2 border-rose-200/50 dark:border-rose-800/30">
            <h2 className="text-2xl font-serif text-primary mb-4 flex items-center gap-3">
              <span className="text-xl">📦</span> 7. Damaged or Tampered Packages
            </h2>
            <div className="space-y-4">
              <div className="bg-rose-600/10 text-rose-700 dark:text-rose-400 p-4 rounded-xl border border-rose-200 dark:border-rose-800 flex flex-col md:flex-row gap-4 items-center">
                <div className="text-4xl">📹</div>
                <div>
                  <p className="font-bold text-lg uppercase mb-1">Unboxing Video Mandatory</p>
                  <p className="text-sm">Record an unboxing video immediately if the package appears tampered, opened, or damaged.</p>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">Contact us within <strong>24 hours</strong> of delivery with proof:</p>
              <div className="flex flex-wrap gap-4">
                <a href="https://wa.me/919326901595" className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-emerald-700 transition-all shadow-md">
                   WhatsApp: +91 93269 01595
                </a>
                <a href="mailto:info@swarnacollection.in" className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/20 transition-all">
                   info@swarnacollection.in
                </a>
              </div>
              <p className="text-xs text-muted-foreground italic mt-2 underline decoration-rose-500/30">Claims made after 24 hours may not be accepted.</p>
            </div>
          </section>

          {/* Section 8 & 9: COD & International */}
          <div className="grid md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h2 className="text-xl font-serif text-primary border-b border-primary/10 pb-2">8. COD Orders</h2>
              <p className="text-sm text-foreground/80">Cash on Delivery is available on eligible orders. Please ensure availability to accept the package. Repeated failed deliveries may lead to restriction of COD services.</p>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-serif text-primary border-b border-primary/10 pb-2">9. International Shipping</h2>
              <p className="text-sm text-foreground/80">Currently, Swarna Collection ships only within India. For international orders or enquiries, contact us at <a href="mailto:info@swarnacollection.in" className="text-primary hover:underline">info@swarnacollection.in</a>.</p>
            </section>
          </div>

          {/* Section 10: Support */}
          <section className="bg-primary/5 p-8 rounded-2xl border border-primary/20 text-center">
            <h2 className="text-2xl font-serif text-primary mb-4">10. Delivery Support</h2>
            <p className="text-foreground/80 mb-6">For any shipping or delivery-related queries, reach out to us:</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Email</p>
                <p className="text-primary font-medium">info@swarnacollection.in</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-primary/20" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">WhatsApp</p>
                <p className="text-primary font-medium">+91 93269 01595</p>
              </div>
            </div>
          </section>

          <ShippingFaq />

          <div className="mt-12 text-center">
            <Link href="/#products">
              <Button size="lg" className="rounded-full px-12 shadow-xl hover:shadow-primary/30 transition-all font-serif italic text-lg hover:-translate-y-1 active:translate-y-0">
                Continue Shopping
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
