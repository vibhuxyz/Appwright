import { useState } from "react";
import { AnnouncementBar } from "./AnnouncementBar";
import { LandingHeader } from "./LandingHeader";
import { PromptComposer } from "./PromptComposer";
import { ShowcaseStrip } from "./ShowcaseStrip";
import { ModelsSection } from "./ModelsSection";
import { TemplatesSection } from "./TemplatesSection";
import { PlatformSection } from "./PlatformSection";
import { WorkspacePreviewSection } from "./WorkspacePreviewSection";
import { PricingSection } from "./PricingSection";
import { FinalCtaSection } from "./FinalCtaSection";
import { LandingFooter } from "./LandingFooter";

interface LandingPageProps {
  onLoginClick: () => void;
  onGetStartedClick: () => void;
}

export function LandingPage({ onLoginClick, onGetStartedClick }: LandingPageProps) {
  const [isBarDismissed, setIsBarDismissed] = useState(false);

  return (
    // The app shell sets `overflow: hidden` on html/body/#root for its fixed
    // 3-pane workspace UI, so a normal scrolling marketing page needs its own
    // scroll container rather than relying on document/body scroll.
    <div className="fixed inset-0 overflow-x-clip overflow-y-auto bg-background font-geist text-foreground antialiased [&_a]:text-foreground [&_a:hover]:text-lime">
      {!isBarDismissed && <AnnouncementBar onDismiss={() => setIsBarDismissed(true)} />}
      <LandingHeader onLoginClick={onLoginClick} onSignupClick={onGetStartedClick} />
      <PromptComposer onSubmit={onGetStartedClick} />
      <ShowcaseStrip />
      <ModelsSection />
      <TemplatesSection />
      <PlatformSection />
      <WorkspacePreviewSection />
      <PricingSection onFreeClick={onGetStartedClick} onProClick={onGetStartedClick} />
      <FinalCtaSection onCtaClick={onGetStartedClick} />
      <LandingFooter />
    </div>
  );
}
