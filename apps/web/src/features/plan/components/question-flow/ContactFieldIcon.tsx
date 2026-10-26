import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import type { ReactElement, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BrandSvg({ children, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      {children}
    </svg>
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
  Phone,
  Email: Mail,
  Address: MapPin,
};

const BRAND: Readonly<Record<string, (props: IconProps) => ReactElement>> = {
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
  return <Phone className={className} aria-hidden />;
}
