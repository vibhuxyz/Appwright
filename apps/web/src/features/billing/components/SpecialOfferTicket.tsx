export function SpecialOfferTicket({
  hours,
  minutes,
  seconds,
}: {
  hours: string;
  minutes: string;
  seconds: string;
}) {
  return (
    <div className="relative mx-auto mt-2.5 max-w-md rounded-xl border border-[#252830] bg-[#14161A] px-3 py-2 text-center sm:px-4 sm:py-2.5">
      {/* Coupon perforation side cutouts */}
      <div className="absolute top-1/2 -left-2 size-3.5 -translate-y-1/2 rounded-full border-r border-[#252830] bg-[#0E1013]" />
      <div className="absolute top-1/2 -right-2 size-3.5 -translate-y-1/2 rounded-full border-l border-[#252830] bg-[#0E1013]" />

      {/* Promocode applied status line */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-foreground-secondary">
        <span className="font-bold text-[#E3FC18]">✓</span>
        <span className="font-mono font-bold text-[#E3FC18]">
          vik6_PERSONAL_PROMO
        </span>
        <span>promocode is applied</span>
      </div>

      <div className="my-1.5 border-t border-dashed border-[#282B33]" />

      <div className="grid grid-cols-2 items-center divide-x divide-[#282B33]">
        <div className="pr-3 text-center">
          <div className="text-xl font-black tracking-tight text-[#FF2A6D] sm:text-2xl">
            54% OFF
          </div>
          <div className="text-[10px] text-muted">
            With special-offer promo
          </div>
        </div>
        <div className="pl-3 text-center">
          <div className="font-mono text-base font-bold tracking-wider text-white sm:text-lg">
            {hours} : {minutes} : {seconds}
          </div>
          <div className="mt-0.5 flex justify-center gap-2.5 text-[9px] tracking-wide text-muted sm:gap-3.5">
            <span>hours</span>
            <span>minutes</span>
            <span>seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
