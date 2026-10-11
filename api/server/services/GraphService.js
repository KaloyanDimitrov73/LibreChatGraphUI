const axios = require('axios');

/**
 * Proxies graph requests to gc's HubLink backend (the same service LibreChat
 * talks to through the `HubLink` custom endpoint in librechat.yaml).
 *
 * The graph for an answer is stored by gc under the LibreChat response
 * message id, which LibreChat sends with every HubLink completion request in
 * the `X-LibreChat-Message-Id` header.
 */
const BASE = (process.env.HUBLINK_API_URL || 'http://gc-backend:8000').replace(/\/+$/, '');

const client = axios.create({ baseURL: BASE, timeout: 60_000 });

const EMPTY_GRAPH = { nodes: [], edges: [] };

function wrapError(err) {
  const status = err.response?.status;
  const e = new Error(
    status
      ? `HubLink graph request failed (${status}): ${JSON.stringify(err.response.data)}`
      : `HubLink graph request failed: ${err.message}`,
  );
  e.status = status && status < 500 ? status : 502;
  return e;
}

/** Graph retrieved by HubLink for one assistant message. */
async function getGraph({ messageId } = {}) {
  if (!messageId) {
    return EMPTY_GRAPH;
  }
  try {
    const res = await client.get(`/v1/graph/${encodeURIComponent(messageId)}`);
    return res.data;
  } catch (err) {
    // No graph stored: answers that came from a non-HubLink endpoint, or
    // from before graphs were stored.
    if (err.response?.status === 404) {
      return EMPTY_GRAPH;
    }
    throw wrapError(err);
  }
}

/** One-hop ORKG neighbors of a node, as { nodes, edges }. */
async function getNeighbors(nodeId) {
  try {
    const res = await client.get('/v1/graph/neighbors', { params: { nodeId } });
    return res.data;
  } catch (err) {
    throw wrapError(err);
  }
}

module.exports = { getGraph, getNeighbors };
