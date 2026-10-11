import { MessagesSquare } from 'lucide-react';
import type { NavLink } from '~/common';
import ConversationsSection from '~/components/UnifiedSidebar/ConversationsSection';

/**
 * The HubLink product only needs chat history in the sidebar; the stock
 * LibreChat panels (agents, prompts, memories, bookmarks, files, parameters,
 * MCP, ...) were removed.
 */
const links: NavLink[] = [
  {
    title: 'com_ui_chat_history',
    label: '',
    icon: MessagesSquare,
    id: 'conversations',
    Component: ConversationsSection,
  },
];

export default function useUnifiedSidebarLinks() {
  return links;
}
