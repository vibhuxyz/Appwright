export function IntegrationLogo({
  provider,
  className = "size-5",
}: {
  provider: string;
  className?: string;
}) {
  switch (provider) {
    case "razorpay":
      return <RazorpayLogo className={className} />;
    case "email":
      return <BrevoLogo className={className} />;
    case "google-oauth":
      return <GoogleLogo className={className} />;
    case "cloudinary":
      return <CloudinaryLogo className={className} />;
    case "mongodb":
      return <MongoLogo className={className} />;
    default:
      return <GenericLogo provider={provider} className={className} />;
  }
}

function RazorpayLogo({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#3395FF" d="M8 4h17l-3.4 6.2H17l7.6 10.3H17l-7.6-10.3 3.4-6.2Z" />
      <path fill="#072654" d="M8.1 13.4h7.3L9.1 28H2l6.1-14.6Z" />
    </svg>
  );
}

function BrevoLogo({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#536DFE" d="M8 4h8.4c5 0 7.9 2.2 7.9 6 0 2.2-1.2 3.9-3.3 4.8 3 .7 4.6 2.8 4.6 5.7 0 4.3-3.3 7-8.8 7H8V4Zm7.8 9.2c2.2 0 3.5-.9 3.5-2.6S18 8 15.8 8h-2.4v5.2h2.4Zm.7 9.7c2.5 0 3.8-1 3.8-2.9s-1.3-2.9-3.8-2.9h-3.1v5.8h3.1Z" />
      <circle cx="26.5" cy="6" r="2.5" fill="#FF7A59" />
      <circle cx="5" cy="25" r="2" fill="#00B8A9" />
    </svg>
  );
}

function GoogleLogo({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M28 16.3c0-1-.1-2-.3-3H16v5.6h6.7a5.8 5.8 0 0 1-2.5 3.8v3.6h4.1c2.4-2.2 3.7-5.7 3.7-10Z" />
      <path fill="#34A853" d="M16 28c3.4 0 6.2-1.1 8.3-3l-4.1-3.6c-1.1.7-2.5 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H4.9v3.7A12.5 12.5 0 0 0 16 28Z" />
      <path fill="#FBBC05" d="M9.1 17.5a7.5 7.5 0 0 1 0-5V8.8H4.9a12.5 12.5 0 0 0 0 12.4l4.2-3.7Z" />
      <path fill="#EA4335" d="M16 7.4c1.9 0 3.6.7 4.9 2l3.7-3.7A12.2 12.2 0 0 0 16 2a12.5 12.5 0 0 0-11.1 6.8l4.2 3.7c1-2.9 3.7-5.1 6.9-5.1Z" />
    </svg>
  );
}

function CloudinaryLogo({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#3448C5" d="M13.7 5.2a9.7 9.7 0 0 0-8.8 9.7A7 7 0 0 0 6 28h19.2a6.4 6.4 0 0 0 1.7-12.6 10.6 10.6 0 0 0-13.2-10.2Z" />
      <path fill="#F6C342" d="M13.7 5.2a9.7 9.7 0 0 0-8.8 9.7c1.7-2.8 4.2-4.2 7.4-4.2 3.4 0 5.5 1.8 6.6 4.8 1.2-3.9-.9-8.6-5.2-10.3Z" />
      <path fill="#F28C28" d="M12.2 10.7c3.4 0 5.5 1.8 6.6 4.8h4.6a8.4 8.4 0 0 0-8-7.6c-3.4 0-6.1 1.8-7.8 4.4 1.3-1 2.8-1.6 4.6-1.6Z" />
    </svg>
  );
}

function MongoLogo({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#00ED64" d="M16.7 2.5c-.2 2.1-.9 3.3-2.1 4.8-2.7 3.3-4.3 6.6-4.3 10.5 0 5.3 2.5 9.4 6.7 11.4 4.3-2.5 6.6-6.8 6.4-12.1-.1-4.1-2.4-9.1-6.7-14.6Zm.3 5.2c1.4 6 1.4 12.5-.1 18.8-.1-6.3-.1-12.6.1-18.8Z" />
    </svg>
  );
}

function GenericLogo({ provider, className }: { provider: string; className: string }) {
  const initials = provider.slice(0, 1).toUpperCase();
  return (
    <span className={`grid place-items-center rounded-md bg-violet-500/15 font-bold text-violet-300 ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}
