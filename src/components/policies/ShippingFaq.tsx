import { ScrollReveal } from "@/components/ui/ScrollReveal";

const shippingFaqs = [
  {
    question: "How long does it take to dispatch my order?",
    answer:
      "Confirmed orders are typically processed and dispatched within 2 to 3 business days (Monday to Friday, excluding public holidays). During high-demand periods, dispatch timelines may extend slightly.",
  },
  {
    question: "How long does delivery take after dispatch?",
    answer:
      "Once dispatched, delivery usually takes 4 to 8 business days depending on your location. Timelines are estimates and may take longer for remote or non-metro areas.",
  },
  {
    question: "What can cause delivery delays?",
    answer:
      "Delays can happen due to courier partner issues, weather, strikes, political disruptions, incorrect address or contact details, or other circumstances beyond control.",
  },
  {
    question: "Do you offer priority shipping?",
    answer:
      "Priority shipping may be available for an additional charge (Rs 99). It provides faster dispatch and priority handling, but it does not guarantee same-day or next-day delivery and depends on your PIN code.",
  },
  {
    question: "What happens if delivery fails or the package is returned?",
    answer:
      "If delivery fails due to unavailability, incorrect address, or refusal, the package may be returned. Re-shipping charges will be borne by the customer.",
  },
  {
    question: "What should I do if my package is damaged or looks tampered?",
    answer:
      "Record a clear, continuous unboxing video immediately and contact support within 24 hours of delivery with proof. Claims made after 24 hours may not be accepted.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Currently, shipping is available only within India. For international orders or enquiries, contact support by email.",
  },
];

export function ShippingFaq() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: shippingFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <section className="mt-10 rounded-3xl border border-primary/10 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 md:p-8">
      <ScrollReveal direction="up">
        <div className="mb-6">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-primary">
            Quick Answers
          </span>
          <h2 className="text-2xl font-serif text-gray-900 dark:text-foreground md:text-3xl">
            Shipping FAQ
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Common questions based on our shipping policy.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-3">
        {shippingFaqs.map((item, index) => (
          <ScrollReveal key={item.question} delay={0.06 * index} direction="up">
            <details className="group rounded-2xl border border-stone-200/80 bg-white p-5 transition-colors open:border-primary/30 dark:border-white/10 dark:bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-gray-900 marker:hidden dark:text-foreground md:text-base">
                <span>{item.question}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 text-lg text-primary transition-transform duration-300 group-open:rotate-45 dark:border-white/10">
                  +
                </span>
              </summary>
              <p className="pt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
                {item.answer}
              </p>
            </details>
          </ScrollReveal>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}
