import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function Features() {
    const features = [
        { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹799' },
        { icon: '🔄', title: 'Easy Returns', desc: '7 day return policy' },
        { icon: '✅', title: 'Quality Assured', desc: 'Premium artificial jewellery' },
        { icon: '💳', title: 'Secure Payment', desc: '100% secure transactions' },
    ];

    return (
        <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <ScrollReveal key={idx} delay={idx * 0.1} direction="up">
                            <div className="text-center p-8 bg-white dark:bg-card rounded-lg shadow-sm border border-gray-50 dark:border-white/10 hover:shadow-md transition-shadow">
                                <div className="text-5xl text-primary mb-6">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
                                <p className="text-gray-500">{feature.desc}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
