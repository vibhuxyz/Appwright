import type { SourceDecision } from "./types";

export const SOURCE_DECISIONS: readonly SourceDecision[] = [
  {
    id: "shadcn-ui",
    repository: "https://github.com/shadcn-ui/ui",
    author: "shadcn",
    license: "MIT",
    revision: "main LICENSE.md retrieved 2026-10-23. Commit SHA not pinned.",
    commercialUse: true,
    modification: true,
    redistribution: true,
    decision: "adopt-primitives",
    reason:
      "MIT permits commercial use, modification, and redistribution with the notice. Level A primitives are already vendored. Blocks were not copied because no commit SHA was pinned and each block was not rendered here.",
  },
  {
    id: "magic-ui",
    repository: "https://github.com/magicuidesign/magicui",
    author: "Magic UI",
    license: "MIT",
    revision: "main LICENSE.md retrieved 2026-10-23. Commit SHA not pinned.",
    commercialUse: true,
    modification: true,
    redistribution: true,
    decision: "defer",
    reason:
      "MIT would allow reuse, but components were not isolated, screenshot-checked, or adapted. Many depend on motion. Not ingested.",
  },
  {
    id: "origin-ui",
    repository: "https://github.com/shadcn/originui",
    author: "Origin UI, forked from cosscom/ui",
    license: "AGPL-3.0 upstream; fork LICENSE.md says MIT",
    revision: "Fork LICENSE.md and GitHub parent cosscom/ui retrieved 2026-10-23.",
    commercialUse: false,
    modification: false,
    redistribution: false,
    decision: "reject",
    reason:
      "shadcn/originui is a fork of cosscom/ui, which GitHub records as AGPL-3.0. A MIT file on the fork does not relicense the upstream code. Rejected so generated apps do not inherit AGPL.",
  },
  {
    id: "motion-primitives",
    repository: "https://github.com/ibelick/motion-primitives",
    author: "ibelick",
    license: "none found",
    revision: "package.json 0.1.0 retrieved 2026-10-23. LICENSE and LICENSE.md returned 404. No license field.",
    commercialUse: false,
    modification: false,
    redistribution: false,
    decision: "reject",
    reason:
      "No license file was found, so redistribution is not allowed. The package also targets React 18 and depends on motion, which is not on the generated allowlist.",
  },
  {
    id: "ruixen",
    repository: "https://github.com/ruixenui/ruixen.com",
    author: "Ruixen UI",
    license: "MIT claimed for the free catalog; Pro is paid",
    revision: "GitHub readme retrieved 2026-10-23. Individual files were not reviewed.",
    commercialUse: false,
    modification: false,
    redistribution: false,
    decision: "defer",
    reason:
      "The free catalog is described as MIT and Pro is a paid license. No file was reviewed in isolation, so nothing was ingested. Do not install the registry URL.",
  },
  {
    id: "21st-dev",
    repository: "https://21st.dev/",
    author: "21st Labs and individual publishers",
    license: "mixed; marketplace terms restrict redistribution",
    revision: "21st.dev terms and help docs retrieved 2026-10-23.",
    commercialUse: false,
    modification: false,
    redistribution: false,
    decision: "reject",
    reason:
      "Licenses differ per component. Marketplace terms forbid redistributing marketplace content. Demos and previews are not covered by the component license. Rejected as a bulk source.",
  },
  {
    id: "appwright-original",
    repository: "packages/ui-system/src/sections",
    author: "Appwright",
    license: "internal original",
    revision: "authored 2026-10-23 in this repository",
    commercialUse: true,
    modification: true,
    redistribution: true,
    decision: "adopt",
    reason: "Written for Appwright tokens. No third-party section source was copied.",
  },
];

export function sourceById(id: string): SourceDecision | undefined {
  return SOURCE_DECISIONS.find((source) => source.id === id);
}
