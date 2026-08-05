import type { ReactNode } from 'react';
import { Waypoints } from 'lucide-react';
import { emitGraphEvent } from '~/hooks/Graph/useGraphEvents';
import { getNodeIdFromHref } from '~/utils/graphMentions';

interface GraphNodeMentionProps {
  href: string;
  children: ReactNode;
  conversationId?: string;
  messageId?: string;
}

/** Wire this into your markdown link renderer for hrefs where isGraphNodeHref(href) is true. */
export default function GraphNodeMention({ href, children, conversationId, messageId }: GraphNodeMentionProps) {
  const nodeId = getNodeIdFromHref(href);

  return (
    <button
      type="button"
      onClick={() => emitGraphEvent('chat:reference-click', { nodeId, conversationId, messageId })}
      className="inline-flex items-center gap-1 rounded-full border border-border-medium px-2 py-0.5 text-xs text-text-primary hover:bg-surface-hover"
    >
      <Waypoints className="h-3 w-3" />
      {children}
    </button>
  );
}
