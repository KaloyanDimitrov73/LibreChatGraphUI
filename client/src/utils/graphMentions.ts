const GRAPH_NODE_PROTOCOL = 'graph://node/';

/** True for a markdown link href referring to a graph node, e.g. [Auth Service](graph://node/n2). */
export function isGraphNodeHref(href: string): boolean {
  return href.startsWith(GRAPH_NODE_PROTOCOL);
}

export function getNodeIdFromHref(href: string): string {
  return href.slice(GRAPH_NODE_PROTOCOL.length);
}
