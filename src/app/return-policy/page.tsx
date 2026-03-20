import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Return & Exchange Policy | Swarna Collection',
  description: 'Our policy regarding returns, replacements, and exchanges for Swarna Collection jewellery.',
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <h1 className="text-3xl md:text-5xl font-serif text-primary mb-4">Return & Exchange Policy</h1>
          <p className="text-muted-foreground text-lg">Swarna Collection - Premium Artificial Jewellery</p>
          <div className="w-24 h-1 bg-primary/30 mx-auto mt-6 rounded-full" />
        </div>

        {/* Intro Section */}
        <Card className="p-6 md:p-8 mb-8 border-primary/10 shadow-sm md:shadow-md animate-in fade-in duration-1000">
          <p className="text-foreground/80 leading-relaxed text-center italic md:text-lg">
            At Swarna Collection, every piece is carefully curated and quality-checked before dispatch. 
            Due to the delicate and hygiene-sensitive nature of jewellery, we maintain a strict return 
            and exchange policy as outlined below.
          </p>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-8 animate-in fade-in duration-1000 delay-300">
          
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-serif text-primary border-b border-primary/10 pb-2">1. Eligibility for Returns</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <span>✅</span> Accepted Only If:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80">
                  <li>The product received is damaged during transit</li>
                  <li>An incorrect product has been delivered</li>
                </ul>
              </div>
              <div className="bg-rose-50/50 dark:bg-rose-900/10 p-5 rounded-xl border border-rose-100 dark:border-rose-800">
                <h3 className="font-bold text-rose-800 dark:text-rose-400 mb-3 flex items-center gap-2">
                  <span>❌</span> Not Accepted For:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80">
                  <li>Change of mind or personal preference</li>
                  <li>Minor color/texture variations (lighting/handcrafted)</li>
                  <li>Size or fitting issues (unless wrong item sent)</li>
                  <li>Delayed delivery</li>
                  <li>Sale, discounted, or promotional items</li>
                  <li>Gift cards or store credits</li>
                  <li>Items marked as "Final Sale"</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 italic">
              All decisions regarding eligibility will be at the sole discretion of Swarna Collection after review.
            </p>
          </section>

          {/* Section 2 - Highlighted */}
          <section className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl font-bold">VIDEO</div>
            <h2 className="text-2xl font-serif text-primary mb-4 flex items-center gap-2">
              <span>📹</span> 2. Mandatory Unboxing Video
            </h2>
            <div className="space-y-4">
              <p className="font-medium text-foreground">To raise a valid claim, a clear, continuous unboxing video is mandatory. The video must show:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
                <li className="flex items-center gap-2 text-sm bg-background/50 p-2 rounded-lg border border-primary/5">📦 Sealed package</li>
                <li className="flex items-center gap-2 text-sm bg-background/50 p-2 rounded-lg border border-primary/5">✂️ Opening process</li>
                <li className="flex items-center gap-2 text-sm bg-background/50 p-2 rounded-lg border border-primary/5">👁️ Product clearly visible</li>
                <li className="flex items-center gap-2 text-sm bg-background/50 p-2 rounded-lg border border-primary/5">⚠️ Damage/issue (if any)</li>
              </ul>
              <div className="mt-4 p-4 bg-rose-600/10 text-rose-700 dark:text-rose-400 rounded-lg flex items-center gap-3 border border-rose-300/30">
                <span className="text-2xl font-bold">❌</span>
                <p className="font-bold uppercase tracking-tight">Claims without an unboxing video will not be accepted</p>
              </div>
              <div className="mt-6 border-t border-primary/10 pt-4">
                <p className="font-medium text-primary mb-2">Report within 24 hours of delivery:</p>
                <div className="flex flex-wrap gap-4">
                  <a href="https://wa.me/919326901595" className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm hover:bg-emerald-700 transition-colors">
                    <span>💬</span> WhatsApp: +91 93269 01595
                  </a>
                  <a href="mailto:info@swarnacollection.in" className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm hover:bg-primary/20 transition-colors">
                    <span>📧</span> info@swarnacollection.in
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Sections 3 & 4 */}
          <div className="grid md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h2 className="text-xl font-serif text-primary border-b border-primary/10 pb-2">3. Product Condition</h2>
              <ul className="space-y-2 text-sm text-foreground/80 list-disc list-inside">
                <li>Product must be unused and unworn</li>
                <li>Original packaging, tags, invoice, and all inserts</li>
                <li>No signs of use, perfume, stains, or scratches</li>
              </ul>
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                Returns failing inspection will be sent back at customer's cost.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-xl font-serif text-primary border-b border-primary/10 pb-2">4. Reverse Pickup</h2>
              <ul className="space-y-2 text-sm text-foreground/80 list-disc list-inside">
                <li>Reverse pickup arranged only after approval</li>
                <li>If unavailable, customer must self-ship</li>
                <li>Use secure, trackable shipping methods</li>
              </ul>
            </section>
          </div>

          {/* Section 5 & 6 - REFUND POLICY (CRITICAL) */}
          <section className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-inner">
            <h2 className="text-2xl font-serif text-primary mb-4">5 & 6. Refund Policy (Important)</h2>
            <div className="space-y-4">
              <div className="bg-primary/10 p-5 rounded-xl border border-primary/30 flex items-start gap-4">
                <span className="text-3xl text-primary mt-1 italic">!</span>
                <div>
                  <p className="text-xl font-bold text-primary italic mb-2">Swarna Collection does not provide monetary refunds</p>
                  <p className="text-foreground/80 leading-relaxed">
                    All approved returns will be issued as **store credit only**. 
                    This strictly applies to both Prepaid and COD orders.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Store Credit Rules:</h3>
                  <ul className="space-y-1 text-sm text-foreground/80">
                    <li>• Issued to registered email ID</li>
                    <li>• Non-transferable</li>
                    <li>• Cannot be converted to cash</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Validity:</h3>
                  <ul className="space-y-1 text-sm text-foreground/80">
                    <li>• Valid for 6 months</li>
                    <li>• Cannot buy gift cards</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Final Sections */}
          <div className="grid md:grid-cols-3 gap-6">
            <section className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <h3 className="font-bold text-primary mb-2">7. Hygiene</h3>
              <p className="text-xs text-muted-foreground">Jewellery once worn is non-returnable due to safety protocols.</p>
            </section>
            <section className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <h3 className="font-bold text-primary mb-2">8. Partial Returns</h3>
              <p className="text-xs text-muted-foreground">Credit issued only for accepted items. Shipping non-refundable.</p>
            </section>
            <section className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <h3 className="font-bold text-primary mb-2">9. Cancellations</h3>
              <p className="text-xs text-muted-foreground">Cannot be cancelled once dispatched. Before dispatch: subject to approval.</p>
            </section>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/shipping-policy">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-primary/20 hover:bg-primary/5 transition-all font-serif italic text-lg">
                View Shipping Policy
              </Button>
            </Link>
            <Link href="/#products">
              <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-primary/20 transition-all font-serif italic text-lg">
                Continue Shopping
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
