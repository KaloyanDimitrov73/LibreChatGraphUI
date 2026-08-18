import { useEffect, useState, memo } from 'react';
import { usePanelRef } from 'react-resizable-panels';
import { ResizableHandleAlt, ResizablePanel } from '@librechat/client';
import { useGraphEvent } from '~/hooks/Graph/useGraphEvents';
import GraphPanel, { type GraphContext } from './GraphPanel';

/**
 * Owns the resizable/collapsible chrome around GraphPanel and listens for
 * "chat:view-graph" (fired by the message hover button) so the panel opens
 * itself and scopes to the right conversation/message automatically.
 */
const GraphPanelContainer = memo(function GraphPanelContainer() {
  const graphPanelRef = usePanelRef();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<GraphContext>({});

  useGraphEvent('chat:view-graph', ({ conversationId, messageId }) => {
    setContext({ conversationId, messageId });
    setOpen(true);
  });

  useEffect(() => {
    if (open) {
      // Panel refs aren't attached until after layout; double-rAF matches
      // the same pattern ArtifactsPanel uses to expand reliably.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          graphPanelRef.current?.expand();
        });
      });
    } else {
      graphPanelRef.current?.collapse();
    }
  }, [open, graphPanelRef]);

  return (
    <>
      {open && <ResizableHandleAlt withHandle className="bg-border-medium text-text-primary" />}
      <ResizablePanel
        defaultSize="28"
        maxSize="60"
        minSize="15"
        collapsedSize="0"
        collapsible={true}
        panelRef={graphPanelRef}
        id="graph-panel"
      >
        <div className="h-full min-w-[320px] overflow-hidden">
          <GraphPanel open={open} context={context} onToggle={setOpen} />
        </div>
      </ResizablePanel>
    </>
  );
});

GraphPanelContainer.displayName = 'GraphPanelContainer';

export default GraphPanelContainer;
