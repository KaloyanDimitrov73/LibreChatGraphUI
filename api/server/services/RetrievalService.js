const axios = require('axios');
const GraphService = require('./GraphService');

const BASE = process.env.RETRIEVAL_API_URL || process.env.RETRIEVAL_URL || '';

if (!BASE) {
  // No external retrieval backend configured. getNode/getNeighbors fall back
  // to the local static demo graph in GraphService so the graph panel is
  // still usable out of the box; search/ask/askStream still require BASE
  // and will throw below since they have no local equivalent.
  console.warn(
    'RETRIEVAL_API_URL not set — search/ask requests will fail until configured. ' +
      'getNode/getNeighbors will use the local demo graph as a fallback.',
  );
}

const client = axios.create({
  baseURL: BASE,
  timeout: 30_000,
});

// normalize errors
function wrapError(err) {
  if (err.response) {
    const { status, data } = err.response;
    const e = new Error(`RetrievalService error ${status}: ${JSON.stringify(data)}`);
    e.status = status;
    e.payload = data;
    return e;
  }
  return err;
}

module.exports = {
  async search(query, options = {}) {
    // POST /search { query, topK, filters }
    try {
      const body = Object.assign({ query }, options);
      const res = await client.post('/search', body);
      return res.data;
    } catch (err) {
      throw wrapError(err);
    }
  },

  async ask(question, options = {}) {
    // POST /qa/ask { question, context, settings }
    try {
      const body = Object.assign({ question }, options);
      const res = await client.post('/qa/ask', body);
      return res.data;
    } catch (err) {
      throw wrapError(err);
    }
  },

  async askStream(question, options = {}, onChunk) {
    // If the remote supports SSE/streaming, hit /qa/ask/stream and call onChunk for each chunk.
    const url = '/qa/ask/stream';
    try {
      const res = await client({
        method: 'post',
        url,
        data: Object.assign({ question }, options),
        responseType: 'stream',
      });

      const stream = res.data;
      stream.on('data', (chunk) => {
        if (onChunk) onChunk(chunk.toString());
      });
      return new Promise((resolve, reject) => {
        stream.on('end', () => resolve());
        stream.on('error', reject);
      });
    } catch (err) {
      throw wrapError(err);
    }
  },

  async getNode(nodeId) {
    if (!BASE) {
      return GraphService.getNode(nodeId);
    }
    try {
      const res = await client.get(`/graph/node/${encodeURIComponent(nodeId)}`);
      return res.data;
    } catch (err) {
      throw wrapError(err);
    }
  },

  async getNeighbors(nodeId, options = {}) {
    if (!BASE) {
      return GraphService.getNeighbors(nodeId, options);
    }
    try {
      const res = await client.post(`/graph/node/${encodeURIComponent(nodeId)}/neighbors`, options);
      return res.data;
    } catch (err) {
      throw wrapError(err);
    }
  },
};
