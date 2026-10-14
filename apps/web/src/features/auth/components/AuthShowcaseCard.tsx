import { useState, useEffect } from "react";
import { Sparkles, Terminal, ShoppingBag, Utensils } from "lucide-react";

export interface ShowcaseSlide {
  id: string;
  tabLabel: string;
  tag: string;
  title: string;
  subtitle: string;
  builtTime: string;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: "ai-studio",
    tabLabel: "AI SaaS Studio",
    tag: "Next.js 15 + Claude 3.7",
    title: "SYNTHESIS AI STUDIO",
    subtitle: "Full-stack multi-tenant AI workspace with autonomous agents, sandboxes and live code execution.",
    builtTime: "Built with Appwright in 6 mins",
  },
  {
    id: "fintech-terminal",
    tabLabel: "FinTech Terminal",
    tag: "WebSockets + Tailwind",
    title: "NEXUS TRADING PLATFORM",
    subtitle: "Real-time algorithmic trading terminal with live candlestick charts, order books and Stripe payouts.",
    builtTime: "Built with Appwright in 8 mins",
  },
  {
    id: "ecommerce-3d",
    tabLabel: "3D Ecommerce",
    tag: "React 19 + Three.js",
    title: "LUMINA LUXURY COMMERCE",
    subtitle: "High-conversion modern storefront with interactive 3D product showcase, cart drawer & instant checkout.",
    builtTime: "Built with Appwright in 5 mins",
  },
  {
    id: "food-delivery",
    tabLabel: "Food Delivery",
    tag: "PostgreSQL + Mapbox",
    title: "CRAVE FOOD PLATFORM",
    subtitle: "Multi-vendor food delivery application with live courier GPS routing, menu ordering and admin portal.",
    builtTime: "Built with Appwright in 7 mins",
  },
];

const SLIDE_DURATION_MS = 6000;

export function AuthShowcaseCard() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [activeIndex]);

  const currentSlide = SHOWCASE_SLIDES[activeIndex];

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-col justify-between overflow-hidden rounded-2xl bg-[#08090C] p-5 sm:p-6 md:min-h-[600px]">
      {/* Dynamic Background / Website Preview Container */}
      <div className="absolute inset-0 overflow-hidden">
        {/* SLIDE 1: AI SaaS Studio (Real generated high-res dashboard) */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            activeIndex === 0 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <img
            src="/showcase/appwright-studio.jpg"
            alt="AI SaaS Studio"
            className="h-full w-full object-cover object-top opacity-75"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#08090C] via-[#08090C]/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-b from-[#08090C]/70 via-transparent to-transparent" />
        </div>

        {/* SLIDE 2: FinTech Terminal (Interactive dark trading interface mockup) */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            activeIndex === 1 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="h-full w-full bg-[#080B10] p-4 sm:p-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#1E2530] pb-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-white">BTC/USD LIVE</span>
                <span className="font-mono text-xs text-emerald-400 font-semibold">$68,492.50</span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                  +4.82%
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                <span>24h Vol: 48,291 BTC</span>
              </div>
            </div>

            {/* Glowing Candlestick / Area Chart Visualization */}
            <div className="mt-4 rounded-xl border border-[#1C2330] bg-[#0E131C] p-3.5 shadow-lg">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>REAL-TIME EXECUTION ENGINE</span>
                <span className="text-lime">Sub-10ms Latency</span>
              </div>
              <div className="relative mt-2 h-44 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 400 160">
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#1A2230" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="400" y2="70" stroke="#1A2230" strokeDasharray="3 3" />
                  <line x1="0" y1="110" x2="400" y2="110" stroke="#1A2230" strokeDasharray="3 3" />
                  {/* Filled area */}
                  <path
                    d="M 0 130 Q 50 110, 100 80 T 200 60 T 300 40 T 400 20 L 400 160 L 0 160 Z"
                    fill="url(#chartGlow)"
                  />
                  {/* Neon line */}
                  <path
                    d="M 0 130 Q 50 110, 100 80 T 200 60 T 300 40 T 400 20"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  {/* Points */}
                  <circle cx="300" cy="40" r="4" fill="#10b981" className="animate-ping" />
                  <circle cx="300" cy="40" r="4" fill="#ffffff" />
                  <circle cx="400" cy="20" r="4" fill="#10b981" />
                </svg>
              </div>

              {/* Order depth summary cards */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                <div className="rounded-lg bg-[#141A24] p-2 border border-[#202938]">
                  <span className="text-zinc-500 block">Buy Depth</span>
                  <span className="font-bold text-emerald-400">$18.4M</span>
                </div>
                <div className="rounded-lg bg-[#141A24] p-2 border border-[#202938]">
                  <span className="text-zinc-500 block">Sell Depth</span>
                  <span className="font-bold text-rose-400">$14.2M</span>
                </div>
                <div className="rounded-lg bg-[#141A24] p-2 border border-[#202938]">
                  <span className="text-zinc-500 block">Spread</span>
                  <span className="font-bold text-white">0.01%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-[#08090C] via-[#08090C]/50 to-transparent" />
        </div>

        {/* SLIDE 3: 3D Luxury eCommerce Storefront */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            activeIndex === 2 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="h-full w-full bg-[#0B0910] p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#251E33] pb-3">
              <span className="font-serif text-sm font-bold tracking-widest text-white uppercase">
                Lumina Maison
              </span>
              <div className="flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/40 px-2.5 py-1 text-[10px] text-purple-300">
                <ShoppingBag className="size-3" />
                <span>Cart (3 items)</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Product Card 1 */}
              <div className="rounded-xl border border-[#282136] bg-[#140F20] p-3 shadow-md">
                <div className="relative flex h-28 items-center justify-center rounded-lg bg-linear-to-br from-purple-900/30 to-pink-900/10 p-2">
                  <div className="text-center">
                    <span className="inline-block rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-300">
                      3D Model
                    </span>
                    <div className="mt-2 text-2xl">🎧</div>
                  </div>
                </div>
                <h4 className="mt-2 text-xs font-semibold text-white truncate">
                  Aura Studio Pro
                </h4>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-300">$349.00</span>
                  <span className="text-[10px] text-amber-400">★ 4.9</span>
                </div>
              </div>

              {/* Product Card 2 */}
              <div className="rounded-xl border border-[#282136] bg-[#140F20] p-3 shadow-md">
                <div className="relative flex h-28 items-center justify-center rounded-lg bg-linear-to-br from-pink-900/30 to-purple-900/10 p-2">
                  <div className="text-center">
                    <span className="inline-block rounded-full bg-pink-500/20 px-2 py-0.5 text-[9px] font-bold text-pink-300">
                      AR Preview
                    </span>
                    <div className="mt-2 text-2xl">🕶️</div>
                  </div>
                </div>
                <h4 className="mt-2 text-xs font-semibold text-white truncate">
                  Solar Vision AR
                </h4>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-300">$289.00</span>
                  <span className="text-[10px] text-amber-400">★ 5.0</span>
                </div>
              </div>
            </div>

            {/* Instant checkout drawer snippet */}
            <div className="mt-3 rounded-xl border border-[#2E263E] bg-[#191326] p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Instant One-Click Checkout</span>
                <span className="font-mono font-bold text-white">Apple Pay / Stripe</span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-[#08090C] via-[#08090C]/50 to-transparent" />
        </div>

        {/* SLIDE 4: Food Delivery & Courier Logistics Platform */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            activeIndex === 3 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="h-full w-full bg-[#0E0C09] p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#2B2319] pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="size-4 text-orange-400" />
                <span className="text-xs font-bold text-white">CRAVE DISPATCH</span>
              </div>
              <span className="rounded-full bg-orange-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-orange-400">
                ACTIVE COURIER
              </span>
            </div>

            {/* Map & Live Courier Card */}
            <div className="mt-4 rounded-xl border border-[#2B2319] bg-[#17130F] p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">The Artisan Burger Bar</h4>
                  <p className="text-[10px] text-zinc-400">Order #8492 • 3 items</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-orange-400">ETA 6 min</span>
                  <p className="text-[9px] text-emerald-400">On Schedule</p>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="mt-3 flex items-center gap-1.5">
                <div className="h-1.5 flex-1 rounded-full bg-orange-500" />
                <div className="h-1.5 flex-1 rounded-full bg-orange-500" />
                <div className="h-1.5 flex-1 rounded-full bg-orange-500 animate-pulse" />
                <div className="h-1.5 flex-1 rounded-full bg-[#2B2319]" />
              </div>

              {/* Courier info */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-[#201A14] p-2 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛵</span>
                  <div>
                    <p className="font-semibold text-white">Courier: Marcus K.</p>
                    <p className="text-zinc-400">Toyota Prius • Plate 7XY9</p>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-semibold text-emerald-400">
                  GPS Active
                </span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-[#08090C] via-[#08090C]/50 to-transparent" />
        </div>
      </div>

      {/* Floating Pill Badge Header (Clean single pill, no collisions) */}
      <div className="relative z-10 flex items-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/30 bg-black/60 px-3 py-1 text-[11px] font-semibold text-lime backdrop-blur-md shadow-xs">
          <Sparkles className="size-3 text-lime" />
          <span>{currentSlide.tag}</span>
        </span>
      </div>

      {/* Slide Title & Subtitle */}
      <div className="relative z-10 mt-auto pt-6">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          <Terminal className="size-3 text-lime" />
          <span>{currentSlide.builtTime}</span>
        </div>
        <h3 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {currentSlide.title}
        </h3>
        <p className="mt-1 text-xs text-zinc-300 sm:text-sm leading-relaxed max-w-sm">
          {currentSlide.subtitle}
        </p>

        {/* Carousel Tabs & Progress Indicator */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {SHOWCASE_SLIDES.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className="group flex cursor-pointer flex-col items-start text-left focus:outline-none"
              >
                {/* Progress bar line */}
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
                  {isActive && (
                    <div
                      key={`progress-${activeIndex}`}
                      className="h-full w-full rounded-full bg-lime transition-all animate-[growWidth_6s_linear_forwards]"
                    />
                  )}
                </div>
                {/* Tab Label */}
                <span
                  className={`mt-2 truncate text-[10px] font-semibold transition-colors sm:text-[11px] ${
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                >
                  {slide.tabLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
