# Design system

## Overview

Build readable, dense reference interfaces from a shared design system. Risk of
Rain 2 is the current tenant: prioritize item recognition, effect comparison,
game art, and progressive disclosure during a run. Shared controls and palettes
must not acquire game-specific meaning simply because this is their first consumer.

This entry point and its Markdown modules are the authored design specification.
Read their tables and component contracts directly; tooling compiles those definitions for
implementations and the read-only explorer. Do not maintain a second definition
in JSON, CSS or component code.

## Source modules

This file is the entry point and ordered module index. Each linked module below
is authored Markdown, not generated documentation. Read the full relevant
contract, its referenced tokens, and the tenant's content manifest before
generating or updating a product. Modules are compiled in this exact order.

- [Architecture and authoring](design/system.md) <!-- design:include -->
- [Color palettes and aliases](design/colors.md) <!-- design:include -->
- [Themes and tenant mappings](design/themes.md) <!-- design:include -->
- [Typography](design/typography.md) <!-- design:include -->
- [Layout, dimensions and density](design/layout.md) <!-- design:include -->
- [Shape, strokes and elevation](design/effects.md) <!-- design:include -->
- [Control visual recipes](design/control-tokens.md) <!-- design:include -->
- [Component interaction contracts](design/components.md) <!-- design:include -->
- [Workspace, selection and acceptance contracts](design/patterns.md) <!-- design:include -->
- [Accessibility](design/accessibility.md) <!-- design:include -->
- [Iconography and assets](design/iconography.md) <!-- design:include -->
- [Content sources, localization and messages](design/content.md) <!-- design:include -->
- [Illustrative second tenant](design/minecraft.md) <!-- design:include -->
- [Adoption and contribution](design/adoption.md) <!-- design:include -->

## Deterministic generation

Run `npm run design:generate` for optional JSON manifests and
`npm run design:check` for source validation and generated-output drift.
`npm run design:test` validates the compiler and contracts.
Preview, components and the explorer consume the same compiled module graph.

Only the annotated links above are compiled. Ordinary links are references,
not imports. There is no directory scanning, network import, implicit override,
prose inference or dynamic content generation. The compiler rejects missing,
duplicate, nested and unsafe module references, conflicting definitions and
malformed contracts. Source links retain the real module filename and line.

Product adapters consume component and interaction contracts together, not just
the palette. [The content manifest](design-content.json) remains the authority
for pinned gameplay records and artwork. A design split must preserve the
compiled contracts and token CSS before any intentional design change.

## Do's and Don'ts

- Do evolve shared semantic roles and component aliases instead of adding local
  overrides for each screen.
- Do add tokens only for reusable decisions, with an owner and defined consumers.
- Do keep UI messages separate from visual tokens and gameplay data.
- Do preserve user preferences and readable content across responsive changes.
- Don't treat existing deployment literals as permanent design requirements.
- Don't introduce raw component colors, arbitrary spacing, or per-control theme
  branches when a semantic role already expresses the decision.
- Don't present this contract as an implemented theme, localization, or
  accessibility system until its consumers and behavior have been verified.
