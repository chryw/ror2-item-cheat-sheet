## Adoption and verification

Use the contracts before constructing a new UI:

1. Resolve the tenant's declared source inputs and validate its content.
2. Resolve theme metadata, aliases, density and component bindings.
3. Implement the component and composition contracts.
4. Exercise their acceptance scenarios and compare against the declared
   validation baseline, including intentional accessibility improvements.

Run `npm run design:generate` only when a consumer needs materialized JSON.
Run `npm run design:check` to validate source ownership, all declared themes,
component contracts and catalog inputs. Run `npm run design:test` for regression
tests. Neither check nor tests rewrites this document or repairs stale outputs.

`npm run design:export --silent` emits the numeric-color interchange form.
`npm run design:catalog --silent` emits normalized content, provenance and the
asset map. These outputs are derived from their source contracts and may be used
as build artifacts; do not edit them as a second authority.

Run `npm run design:preview` for an isolated reconstruction using those sources.
The reference preview does not replace the production application. Its tenant
exclusions are defined in the component contract; its source revision policy is
defined in the content manifest.

Run the exported browser probes from `/interaction-tests.mjs` in the preview.
Use the contract's acceptance cases for responsive and presentation-transition
coverage. Complete manual accessibility and real-device checks before adopting
the reference implementation in production.

## Contributing

Change a design definition here, never in compiled JSON or CSS. Change gameplay
sources and their provenance in the content manifest, not in design definitions.
Keep rationale only when it adds information rather than repeating a value.
Update implementations and acceptance tests for intentional behavior changes.
Do not change the specification merely to preserve an accidental code literal.

Compilation produces tokens, component configuration, icon data, UI messages
and CSS; it does not synthesize arbitrary event-handling code from prose.
Framework adapters remain reviewed, tested implementations of these contracts.
An on-demand UI generator must consume both the specification and definitive
catalog inputs, then pass the acceptance scenarios rather than treating a
plausible-looking screenshot as proof of equivalence.
