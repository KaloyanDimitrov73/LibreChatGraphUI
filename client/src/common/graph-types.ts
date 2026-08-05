export interface TGraphNode {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
}

export interface TGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface TGraphData {
  nodes: TGraphNode[];
  edges: TGraphEdge[];
}

export interface TGraphNodeDetail extends TGraphNode {
  description?: string;
  properties?: Record<string, unknown>;
  relatedNodeIds?: string[];
}

/** Events exchanged between the Chat view and the Graph view. */
export interface GraphEventMap {
  'graph:node-click': { node: TGraphNode };
  'graph:node-hover': { node: TGraphNode | null };
  'graph:data-loaded': { data: TGraphData };
  'graph:panel-opened': undefined;
  'graph:panel-closed': undefined;
  'chat:reference-click': { nodeId: string; conversationId?: string; messageId?: string };
  'chat:message-sent': { text: string; conversationId?: string };
  'chat:view-graph': { conversationId?: string; messageId?: string };
}

export type GraphEventName = keyof GraphEventMap;
