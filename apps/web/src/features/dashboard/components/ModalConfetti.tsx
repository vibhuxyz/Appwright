export function ModalConfetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 overflow-hidden">
      {/* Mint circle */}
      <span className="absolute bottom-16 left-6 size-2.5 rounded-full bg-[#5EEAD4]/80 shadow-xs" />
      {/* Cyan square */}
      <span className="absolute right-8 bottom-16 size-3 rotate-12 rounded-xs bg-[#38BDF8]/90" />
      {/* Coral dot */}
      <span className="absolute bottom-3 left-8 size-2.5 rounded-full bg-[#F87171]/90" />
      {/* Blue small circle */}
      <span className="absolute right-28 bottom-3 size-2 rounded-full bg-[#60A5FA]/80" />
      {/* Lime tilted square */}
      <span className="absolute bottom-2 left-1/4 size-3 rotate-45 rounded-xs bg-[#E3FC18]/90" />
      {/* Mint square */}
      <span className="absolute bottom-16 left-1/2 size-2 -translate-x-1/2 rounded-xs bg-[#5EEAD4]/80" />
      {/* Cyan diamond */}
      <span className="absolute right-14 bottom-2 size-3 rotate-45 rounded-xs bg-[#38BDF8]/90" />
      {/* Yellow square */}
      <span className="absolute right-6 bottom-4 size-2.5 rotate-12 rounded-xs bg-[#E3FC18]/80" />
      {/* Yellow circle */}
      <span className="absolute right-1/3 bottom-2 size-2.5 rounded-full bg-[#E3FC18]/90" />
      {/* Pink pill */}
      <span className="absolute right-3 bottom-10 size-2 rounded-xs bg-[#F472B6]/90" />
    </div>
  );
}
