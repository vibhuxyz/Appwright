import { Plus } from "lucide-react";

const MAX_QUESTIONS = 10;

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqStackProps {
  heading: string;
  items: readonly FaqItem[];
}

export function FaqStack({ heading, items }: FaqStackProps) {
  if (items.length === 0) return null;
  return (
    <section data-section="faq.stack" className="bg-background text-foreground">
      <div className="mx-auto grid max-w-screen-xl gap-10 px-4 py-20 md:grid-cols-12 md:px-8">
        <h2 className="font-heading text-3xl font-bold tracking-tight md:col-span-4 md:text-4xl">{heading}</h2>
        <div className="divide-y divide-border border-y border-border md:col-span-8">
          {items.slice(0, MAX_QUESTIONS).map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                {item.question}
                <Plus aria-hidden="true" className="size-5 shrink-0 transition-transform duration-200 ease-out group-open:rotate-45 motion-reduce:transition-none" />
              </summary>
              <p className="mt-3 max-w-2xl text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
