import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function About() {
    return (
        <section id="our-story" className="py-16 md:py-24 bg-white dark:bg-[#0a0a0a] overflow-hidden scroll-mt-20">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal direction="up" delay={0.1}>
                        <div className="text-center mb-10 md:mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                                Our Story
                            </h2>
                            <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
                        </div>
                    </ScrollReveal>

                    <div className="space-y-12 text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                        <ScrollReveal direction="up" delay={0.2}>
                            <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left">
                                Swarna was started with a simple dream — to make jewellery affordable, convenient, and accessible for women who balance work, home, and family every day.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.3}>
                            <p>
                                The idea of Swarna began while working as a teacher and managing family responsibilities. During this time, it became clear that many women, especially teachers and working mothers, often do not have the time to visit multiple stores to find good jewellery at reasonable prices.
                            </p>
                        </ScrollReveal>

                        <div className="grid md:grid-cols-2 gap-12 items-center py-8">
                            <ScrollReveal direction="left" delay={0.4}>
                                <div className="bg-gray-50 dark:bg-white/5 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/10 italic">
                                    "With the support of a loving family, Swarna was created to bring elegant jewellery to teachers, working women, young girls, and women of every age — delivered directly to their doorstep."
                                </div>
                            </ScrollReveal>
                            <ScrollReveal direction="right" delay={0.5}>
                                <p className="text-base md:text-lg">
                                    Every piece at Swarna is carefully selected, keeping in mind the needs of busy women who want beautiful jewellery at affordable prices.
                                </p>
                            </ScrollReveal>
                        </div>

                        <ScrollReveal direction="up" delay={0.6}>
                            <p>
                                Swarna is built on middle class values, family support, and the belief that jewellery should help every woman feel confident and beautiful.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.7}>
                            <div className="text-center pt-8">
                                <p className="text-2xl md:text-3xl font-semibold text-primary" style={{ fontFamily: 'Georgia, serif' }}>
                                    Because every girl and every hardworking woman deserves to shine. ✨
                                </p>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
