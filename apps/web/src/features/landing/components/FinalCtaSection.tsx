export function FinalCtaSection({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="px-6 py-16 sm:py-26">
      <div className="relative mx-auto max-w-275 overflow-hidden rounded-3xl border border-border bg-[#17191b] p-9 text-center sm:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff0d 1px,transparent 1px),linear-gradient(90deg,#ffffff0d 1px,transparent 1px)",
            backgroundSize: "54px 54px",
          }}
        />
        <div className="relative">
          <p className="m-0 text-[30px] leading-[1.02] font-extrabold tracking-tighter text-balance sm:text-[58px]">
            Your next app is
            <br />
            one sentence away.
          </p>
          <p className="mx-auto mt-4.5 max-w-130 text-base leading-relaxed text-foreground-secondary">
            Type the idea. Appwright plans it, builds it, tests it and puts it online.
          </p>
          <div className="mt-7.5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onCtaClick}
              className="cursor-pointer rounded-xl bg-lime px-7.5 py-4 text-[15px] font-bold text-background-deep hover:brightness-110"
            >
              Start building free
            </button>
            <a
              href="#workspace"
              className="rounded-xl border border-border bg-surface-2 px-6.5 py-4 text-[15px] font-semibold text-foreground"
            >
              Watch a build
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
