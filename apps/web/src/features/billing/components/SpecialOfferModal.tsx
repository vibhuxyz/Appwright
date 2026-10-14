import { useEffect } from "react";
import { Gift, X } from "lucide-react";
import { SpecialOfferTicket } from "./SpecialOfferTicket";
import { useOfferCountdown } from "../hooks/useOfferCountdown";

function ConfettiDecorations() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 overflow-hidden">
      {/* Mint circle */}
      <span className="absolute bottom-28 left-20 size-3 rounded-full bg-[#5EEAD4]/80 shadow-xs" />
      {/* Cyan square */}
      <span className="absolute right-28 bottom-24 size-3.5 rotate-12 rounded-xs bg-[#38BDF8]/90" />
      {/* Yellow/lime circle */}
      <span className="absolute bottom-16 left-1/3 size-2.5 rounded-full bg-[#E3FC18]/90" />
      {/* Cyan small dot */}
      <span className="absolute bottom-18 left-28 size-2.5 rounded-full bg-[#38BDF8]/80" />
      {/* Coral circle */}
      <span className="absolute bottom-14 left-36 size-3 rounded-full bg-[#F87171]/80" />
      {/* Coral dot */}
      <span className="absolute bottom-6 left-16 size-2.5 rounded-full bg-[#F87171]/90" />
      {/* Blue small circle */}
      <span className="absolute right-36 bottom-14 size-2.5 rounded-full bg-[#60A5FA]/80" />
      {/* Lime triangle/square */}
      <span className="absolute bottom-6 left-1/4 size-3 rotate-45 rounded-xs bg-[#E3FC18]/90" />
      {/* Mint square */}
      <span className="absolute bottom-20 left-1/2 size-2.5 -translate-x-1/2 rounded-xs bg-[#5EEAD4]/80" />
      {/* Cyan tilted square */}
      <span className="absolute right-24 bottom-8 size-3.5 rotate-45 rounded-xs bg-[#38BDF8]/90" />
      {/* Yellow square */}
      <span className="absolute right-16 bottom-8 size-2.5 rotate-12 rounded-xs bg-[#E3FC18]/80" />
      {/* Mint tilted rect */}
      <span className="absolute right-20 bottom-22 size-3 -rotate-12 rounded-xs bg-[#5EEAD4]/80" />
      {/* Yellow circle */}
      <span className="absolute right-1/3 bottom-6 size-2.5 rounded-full bg-[#E3FC18]/90" />
      {/* Light pink pill */}
      <span className="absolute right-8 bottom-10 size-2.5 rounded-xs bg-[#F472B6]/90" />
    </div>
  );
}

export function SpecialOfferModal({
  isOpen,
  onClose,
  onClaim,
}: {
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
}) {
  const { hours, minutes, seconds } = useOfferCountdown();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
      <div
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-[#26282E] bg-[#14161A] p-6 text-center text-foreground shadow-2xl shadow-black sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {/* Gift Icon Badge */}
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-white/10 bg-[#1D2026] text-white shadow-inner">
          <Gift className="size-6 text-white" />
        </div>

        {/* Heading */}
        <h2 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Congratulations! You received
        </h2>
        <div className="mt-1 text-2xl font-black tracking-tight text-[#E3FC18] sm:text-3xl">
          a personal 54% OFF offer
        </div>

        {/* Subtitle */}
        <p className="mt-2 text-xs text-foreground-secondary/90 sm:text-sm">
          This offer is active for limited time only. Get Premium plans with 54% OFF
        </p>

        {/* Promo Ticket */}
        <div className="mt-4">
          <SpecialOfferTicket hours={hours} minutes={minutes} seconds={seconds} />
        </div>

        {/* Claim Discount Button with Confetti */}
        <div className="relative mt-8 pt-2">
          <ConfettiDecorations />
          <button
            type="button"
            onClick={() => {
              onClose();
              onClaim();
            }}
            className="relative z-10 w-full cursor-pointer rounded-2xl bg-[#E3FC18] py-4 text-center text-sm font-bold text-black shadow-xl shadow-[#E3FC18]/25 transition-all hover:bg-[#D4ED15] active:scale-98"
          >
            Claim Discount
          </button>
        </div>
      </div>
    </div>
  );
}
