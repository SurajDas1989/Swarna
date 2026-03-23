import { ScrollReveal } from "@/components/ui/ScrollReveal";

const faqs = [
    {
        question: "What is imitation jewellery?",
        answer:
            "Imitation jewellery is fashion jewellery designed to give the look of fine jewellery at a more affordable price. It is popular for daily wear, festive styling, weddings, and gifting.",
    },
    {
        question: "Is imitation jewellery good for daily wear?",
        answer:
            "Yes, many imitation jewellery pieces are suitable for light daily wear. To help them stay beautiful for longer, keep them away from water, perfume, sweat, and harsh chemicals.",
    },
    {
        question: "How do I make imitation jewellery last longer?",
        answer:
            "Store each piece in a dry box or soft pouch, wipe it gently after use, and avoid direct contact with moisture, deodorant, makeup, or hairspray. Proper storage makes a big difference.",
    },
    {
        question: "Can imitation jewellery be worn for weddings and parties?",
        answer:
            "Absolutely. Imitation jewellery is a popular choice for bridal looks, festive outfits, family functions, and parties because it offers statement styling without the weight or cost of fine jewellery.",
    },
    {
        question: "Will imitation jewellery lose its color over time?",
        answer:
            "Like most fashion accessories, imitation jewellery can show wear over time if exposed to water, sweat, or chemicals regularly. Gentle use and careful storage help preserve the finish much longer.",
    },
    {
        question: "How should I clean imitation jewellery at home?",
        answer:
            "Use a soft dry cloth after wearing it. For light surface dust, wipe gently and avoid soaking or scrubbing. Strong cleaners and water-based washing can damage the polish and stones.",
    },
];

export function FaqSection() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    };

    return (
        <section id="faq" className="relative overflow-hidden bg-white py-16 font-sans transition-colors duration-300 dark:bg-background lg:py-24 scroll-mt-20">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-stone-100/70 to-transparent dark:from-white/5" />
            <div className="absolute left-[-6rem] top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-10 right-[-5rem] h-52 w-52 rounded-full bg-amber-200/20 blur-3xl dark:bg-primary/10" />

            <div className="container relative mx-auto max-w-6xl px-4">
                <ScrollReveal>
                    <div className="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
                        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.22em] text-primary">
                            Helpful Guide
                        </span>
                        <h2 className="text-3xl font-semibold text-gray-900 dark:text-foreground md:text-4xl">
                            Frequently Asked Questions About Imitation Jewellery
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300 md:text-base">
                            A quick guide for everyday care, wear, and styling so customers can shop imitation jewellery
                            with confidence.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid gap-4 lg:grid-cols-2">
                    {faqs.map((item, index) => (
                        <ScrollReveal key={item.question} delay={0.08 * index} direction={index % 2 === 0 ? "up" : "none"}>
                            <details className="group rounded-3xl border border-stone-200/80 bg-white/90 p-5 shadow-[0_18px_55px_-30px_rgba(15,23,42,0.35)] backdrop-blur transition-colors open:border-primary/30 dark:border-white/10 dark:bg-white/5">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium text-gray-900 marker:hidden dark:text-foreground md:text-lg">
                                    <span>{item.question}</span>
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 text-lg text-primary transition-transform duration-300 group-open:rotate-45 dark:border-white/10">
                                        +
                                    </span>
                                </summary>
                                <p className="pt-4 text-sm leading-7 text-gray-600 dark:text-gray-300 md:text-base">
                                    {item.answer}
                                </p>
                            </details>
                        </ScrollReveal>
                    ))}
                </div>
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </section>
    );
}
