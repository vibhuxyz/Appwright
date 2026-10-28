import { cn } from "@/components/ui/utils";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { ON_IMAGE_SCRIM_CLASS, ON_IMAGE_TEXT_CLASS } from "@/components/patterns/shared/on-image";

export interface CampaignBannerProps {
  eyebrow?: string;
  title: string;
  image: MediaImage;
  action: { label: string; href: string };
  align?: "start" | "end";
}

export function CampaignBanner({ eyebrow, title, image, action, align = "start" }: CampaignBannerProps) {
  return (
    <section data-section="commerce.campaign-banner" className="bg-background px-4 py-10 md:px-8">
      <a
        href={action.href}
        className="group relative mx-auto block aspect-4/5 max-w-screen-2xl overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:aspect-21/9"
      >
        <Media image={image} fill entrance="wipe" sizes="100vw" imageClassName="transition-transform duration-700 ease-out motion-safe:group-hover:scale-105" />
        <div aria-hidden="true" className={cn("absolute inset-0", ON_IMAGE_SCRIM_CLASS)} />
        <div className={cn("absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 md:p-12", align === "end" && "md:items-end md:text-right", ON_IMAGE_TEXT_CLASS)}>
          {eyebrow && <p className="text-xs uppercase tracking-widest">{eyebrow}</p>}
          <h2 className="max-w-2xl font-heading text-4xl font-bold uppercase leading-none tracking-tight text-balance md:text-6xl">{title}</h2>
          <span className="inline-flex h-12 w-fit items-center bg-primary px-6 text-sm font-semibold uppercase tracking-wider text-primary-foreground">{action.label}</span>
        </div>
      </a>
    </section>
  );
}
