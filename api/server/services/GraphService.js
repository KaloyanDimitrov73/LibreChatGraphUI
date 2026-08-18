const nodes = [
  { id: 'n1', label: 'Conversation Service', type: 'service', description: 'Handles chat sessions.', properties: { owner: 'platform-team' } },
  { id: 'n2', label: 'Auth Service', type: 'service', description: 'Issues and validates JWTs.', properties: { owner: 'security-team' } },
  { id: 'n3', label: 'MongoDB', type: 'datastore', description: 'Primary conversation store.', properties: { region: 'eu-central' } },
  { id: 'n4', label: 'MCP Server', type: 'integration', description: 'External tool provider.', properties: { protocol: 'MCP' } },
];

const edges = [
  { id: 'e1', source: 'n1', target: 'n2', label: 'authenticates via' },
  { id: 'e2', source: 'n1', target: 'n3', label: 'reads/writes' },
  { id: 'e3', source: 'n1', target: 'n4', label: 'calls' },
];

async function getGraph({ conversationId, messageId } = {}) {
  // TODO: once RETRIEVAL_API_URL is configured, scope this to the given
  // conversationId/messageId via the real HubLink retrieval backend instead
  // of returning the same static graph for every request.
  return { nodes: nodes.map(({ description, properties, ...rest }) => rest), edges };
}

async function getNode(nodeId) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  return {
    ...node,
    relatedNodeIds: edges
      .filter((e) => e.source === nodeId || e.target === nodeId)
      .map((e) => (e.source === nodeId ? e.target : e.source)),
  };
}

module.exports = { getGraph, getNode };
