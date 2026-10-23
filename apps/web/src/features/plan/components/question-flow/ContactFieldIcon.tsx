import { Globe, Headset, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import type { ReactElement, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BrandSvg({ children, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      {children}
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <BrandSvg className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" />
    </BrandSvg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <BrandSvg className={className}>
      <path
        fill="currentColor"
        d="M14 8.2h2.8V4.5H14c-2.6 0-4.4 1.8-4.4 4.5V12H7.2v3.6h2.4V22h3.7v-6.4h2.7l.6-3.6h-3.3V9.4c0-.7.4-1.2 1.1-1.2Z"
      />
    </BrandSvg>
  );
}

function TikTokIcon({ className }: IconProps) {
  return (
    <BrandSvg className={className}>
      <path
        fill="currentColor"
        d="M14.2 3h3.1c.3 2.4 1.7 4.2 4.2 4.6v3.1c-1.5 0-2.9-.5-4.1-1.3v6.7c0 3.7-3 6.6-6.7 6.6S4 19.8 4 16.1s3-6.6 6.7-6.6c.4 0 .7 0 1.1.1v3.3c-.3-.1-.7-.2-1.1-.2-1.8 0-3.3 1.5-3.3 3.4s1.5 3.4 3.3 3.4 3.4-1.5 3.4-3.4V3Z"
      />
    </BrandSvg>
  );
}

function WhatsAppIcon({ className }: IconProps) {
  return (
    <BrandSvg className={className}>
      <path
        fill="currentColor"
        d="M12 3.2A8.7 8.7 0 0 0 4.5 16.4L3.2 21l4.7-1.2A8.8 8.8 0 1 0 12 3.2Zm4.8 12.4c-.2.6-1.2 1.1-1.7 1.1-.4 0-.9.2-3.1-.7-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1 2.2 1.3 2.5 1.5.3.1.5.1.7-.1l.9-1.2c.2-.2.4-.2.6-.1l2 .9c.3.1.4.2.5.3.1.4 0 1.1-.2 1.7Z"
      />
    </BrandSvg>
  );
}

const LUCIDE: Readonly<Record<string, LucideIcon>> = {
  Website: Globe,
  Phone,
  Email: Mail,
  Support: Headset,
  Address: MapPin,
};

const BRAND: Readonly<Record<string, (props: IconProps) => ReactElement>> = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  TikTok: TikTokIcon,
  WhatsApp: WhatsAppIcon,
};

interface ContactFieldIconProps {
  name: string;
  className?: string;
}

export function ContactFieldIcon({ name, className }: ContactFieldIconProps) {
  const Brand = BRAND[name];
  if (Brand) return <Brand className={className} />;
  const Lucide = LUCIDE[name];
  if (Lucide) return <Lucide className={className} aria-hidden />;
  return <Globe className={className} aria-hidden />;
}
