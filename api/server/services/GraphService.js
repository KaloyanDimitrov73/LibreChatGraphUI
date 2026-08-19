const { nanoid } = require('nanoid');

// In-memory store, seeded with a demo graph describing this app's own
// architecture. There is no database-backed persistence yet — data lives
// only for the lifetime of the server process. Positions are persisted
// here (not just client-side) so a reload/reopen keeps the layout the
// user arranged.
let nodes = [
  {
    id: 'n1',
    label: 'Conversation Service',
    type: 'service',
    description: 'Handles chat sessions.',
    properties: { owner: 'platform-team' },
    x: 260,
    y: 160,
  },
  {
    id: 'n2',
    label: 'Auth Service',
    type: 'service',
    description: 'Issues and validates JWTs.',
    properties: { owner: 'security-team' },
    x: 460,
    y: 100,
  },
  {
    id: 'n3',
    label: 'MongoDB',
    type: 'datastore',
    description: 'Primary conversation store.',
    properties: { region: 'eu-central' },
    x: 460,
    y: 220,
  },
  {
    id: 'n4',
    label: 'MCP Server',
    type: 'integration',
    description: 'External tool provider.',
    properties: { protocol: 'MCP' },
    x: 120,
    y: 280,
  },
];

let edges = [
  { id: 'e1', source: 'n1', target: 'n2', label: 'authenticates via' },
  { id: 'e2', source: 'n1', target: 'n3', label: 'reads/writes' },
  { id: 'e3', source: 'n1', target: 'n4', label: 'calls' },
];

function toPublicNode({ description, properties, ...rest }) {
  return rest;
}

async function getGraph({ conversationId, messageId } = {}) {
  // TODO: once RETRIEVAL_API_URL is configured, scope this to the given
  // conversationId/messageId via the real HubLink retrieval backend instead
  // of returning the same in-memory graph for every request.
  return { nodes: nodes.map(toPublicNode), edges };
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

// Local fallback for "Load Neighbors" when no external retrieval backend
// (RETRIEVAL_API_URL) is configured. Walks the same in-memory graph used
// by getGraph/getNode so the button has something to expand against instead
// of silently failing. Once a real retrieval backend exists, RetrievalService
// should prefer that and only fall back to this for local/demo use.
async function getNeighbors(nodeId) {
  const neighborIds = edges
    .filter((e) => e.source === nodeId || e.target === nodeId)
    .map((e) => (e.source === nodeId ? e.target : e.source));

  const neighborNodes = nodes.filter((n) => neighborIds.includes(n.id)).map(toPublicNode);
  const neighborEdges = edges.filter((e) => e.source === nodeId || e.target === nodeId);

  return { nodes: neighborNodes, edges: neighborEdges };
}

// ---- Mutations: nodes -------------------------------------------------

async function createNode({ label, type, description, properties, x, y } = {}) {
  const trimmed = (label || '').trim();
  if (!trimmed) {
    const err = new Error('label is required');
    err.status = 400;
    throw err;
  }
  const node = {
    id: nanoid(10),
    label: trimmed,
    type: type || 'custom',
    description: description || '',
    properties: properties || {},
    x: typeof x === 'number' ? x : 0,
    y: typeof y === 'number' ? y : 0,
  };
  nodes.push(node);
  return toPublicNode(node);
}

async function updateNode(nodeId, patch = {}) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  if (typeof patch.label === 'string') {
    const trimmed = patch.label.trim();
    if (!trimmed) {
      const err = new Error('label cannot be empty');
      err.status = 400;
      throw err;
    }
    node.label = trimmed;
  }
  if (typeof patch.type === 'string') node.type = patch.type;
  if (typeof patch.description === 'string') node.description = patch.description;
  if (patch.properties && typeof patch.properties === 'object') node.properties = patch.properties;
  if (typeof patch.x === 'number') node.x = patch.x;
  if (typeof patch.y === 'number') node.y = patch.y;

  return toPublicNode(node);
}

async function deleteNode(nodeId) {
  const before = nodes.length;
  nodes = nodes.filter((n) => n.id !== nodeId);
  const deleted = nodes.length !== before;
  // Deleting a node deletes any edge touching it, same as ON DELETE CASCADE.
  edges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
  return deleted;
}

// ---- Mutations: edges --------------------------------------------------

async function createEdge({ source, target, label } = {}) {
  if (!source || !target) {
    const err = new Error('source and target are required');
    err.status = 400;
    throw err;
  }
  if (source === target) {
    const err = new Error('source and target must differ');
    err.status = 400;
    throw err;
  }
  const sourceExists = nodes.some((n) => n.id === source);
  const targetExists = nodes.some((n) => n.id === target);
  if (!sourceExists || !targetExists) {
    const err = new Error('source or target node not found');
    err.status = 404;
    throw err;
  }
  const duplicate = edges.some((e) => e.source === source && e.target === target);
  if (duplicate) {
    const err = new Error('edge already exists');
    err.status = 409;
    throw err;
  }

  const edge = { id: nanoid(10), source, target, label: label || '' };
  edges.push(edge);
  return edge;
}

async function deleteEdge(edgeId) {
  const before = edges.length;
  edges = edges.filter((e) => e.id !== edgeId);
  return edges.length !== before;
}

module.exports = {
  getGraph,
  getNode,
  getNeighbors,
  createNode,
  updateNode,
  deleteNode,
  createEdge,
  deleteEdge,
};
