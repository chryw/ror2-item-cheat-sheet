import { fileURLToPath } from 'node:url';
import { createCanvas, CanvasError, joinSession } from '@github/copilot-sdk/extension';
import { createDesignServer, loadSnapshot } from './server.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const instances = new Map();

await joinSession({
  canvases: [
    createCanvas({
      id: 'ror2-design-system',
      displayName: 'Design System Explorer',
      description: 'Browse the repository’s design principles, tokens, components, patterns, and source-backed guidelines.',
      actions: [
        {
          name: 'inspect_system',
          description: 'Read the current worktree design-system inventory and open panels’ view state.',
          handler: async () => {
            try {
              const snapshot = loadSnapshot(root);
              return {
                name: snapshot.metadata.name,
                schemaVersion: snapshot.schemaVersion,
                revision: snapshot.metadata.revision,
                themes: snapshot.themes,
                tokenCount: snapshot.tokens.length,
                componentCount: snapshot.components.length,
                principleCount: snapshot.principles?.rules.length ?? 0,
                principlesStatus: snapshot.principles ? 'sourced' : 'unavailable',
                sourceIssues: snapshot.sourceIssues,
                referenceAreas: Object.fromEntries(Object.entries(snapshot.documentation).map(([page, slots]) => [
                  page, { sourced: slots.filter(slot => slot.available).length, total: slots.length },
                ])),
                panels: [...instances].map(([instanceId, panel]) => ({ instanceId, view: panel.view })),
              };
            } catch (error) {
              throw new CanvasError('DESIGN_READ_FAILED', error.message);
            }
          },
        },
      ],
      open: async ({ instanceId }) => {
        try {
          loadSnapshot(root);
          if (!instances.has(instanceId)) {
            const panel = createDesignServer(root);
            await new Promise((resolve, reject) => {
              panel.server.once('error', reject);
              panel.server.listen(0, '127.0.0.1', resolve);
            });
            instances.set(instanceId, panel);
          }
          const panel = instances.get(instanceId);
          return { title: 'Design System Explorer', url: `http://127.0.0.1:${panel.server.address().port}/` };
        } catch (error) {
          throw new CanvasError('DESIGN_OPEN_FAILED', error.message);
        }
      },
      onClose: async ({ instanceId }) => {
        const panel = instances.get(instanceId);
        if (panel) {
          await new Promise((resolve, reject) => panel.server.close(error => (error ? reject(error) : resolve())));
          instances.delete(instanceId);
        }
      },
    }),
  ],
});
