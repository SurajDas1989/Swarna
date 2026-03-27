import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function Features() {
    const features = [
        { icon: '🚚', title: 'Free Shipping', desc: 'On orders above \u20B9799' },
  { icon: '🔄', title: 'Return Support', desc: '24-hour damaged/wrong-item claims' },
        { icon: '✅', title: 'Quality Assured', desc: 'Premium artificial jewellery' },
        { icon: '💳', title: 'Secure Payment', desc: '100% secure transactions' },
    ];

    return (
        <section className="py-12 md:py-16 bg-background">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {features.map((feature, idx) => (
                        <ScrollReveal key={idx} delay={idx * 0.1} direction="up">
                            <div className="text-center p-5 md:p-8 bg-white dark:bg-card rounded-lg shadow-sm border border-gray-50 dark:border-white/10 hover:shadow-md transition-shadow h-full flex flex-col items-center justify-center">
                                <div className="text-3xl md:text-5xl text-primary mb-3 md:mb-6">{feature.icon}</div>
                                <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-foreground">{feature.title}</h3>
                                <p className="text-[10px] md:text-base text-gray-500 line-clamp-2 leading-tight md:leading-normal">{feature.desc}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
