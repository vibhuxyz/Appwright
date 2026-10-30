import { cn } from "@/components/ui/utils";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { Reveal } from "@/components/patterns/shared/reveal";

const TONE_CLASS = {
  inverse: "bg-foreground text-background",
  accent: "bg-primary text-primary-foreground",
  muted: "bg-muted text-foreground",
} as const;

export type PromoTone = keyof typeof TONE_CLASS;

export interface SplitPromoProps {
  eyebrow?: string;
  title: string;
  body?: string;
  action: { label: string; href: string };
  image: MediaImage;
  imageSide?: "left" | "right";
  tone?: PromoTone;
}

export function SplitPromo({ eyebrow, title, body, action, image, imageSide = "left", tone = "inverse" }: SplitPromoProps) {
  return (
    <section data-section="commerce.split-promo" className="bg-background px-4 py-10 md:px-8">
      <div className="mx-auto grid max-w-screen-2xl md:grid-cols-2">
        <div className={cn("relative aspect-4/3 md:aspect-auto md:min-h-96", imageSide === "right" && "md:order-2")}>
          <Media image={image} fill />
        </div>
        <Reveal className={cn("flex flex-col items-center justify-center gap-6 px-8 py-16 text-center md:px-16", TONE_CLASS[tone])}>
          {eyebrow && <p className="text-xs uppercase tracking-widest">{eyebrow}</p>}
          <h2 className="font-heading text-4xl tracking-tight text-balance md:text-6xl">{title}</h2>
          {body && <p className="max-w-md text-sm leading-relaxed">{body}</p>}
          <a href={action.href} className="text-xs uppercase tracking-widest underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            {action.label}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
