const axios = require('axios');
const { logger } = require('~/config');

const RETRIEVAL_API_URL = process.env.RETRIEVAL_API_URL;
const RETRIEVAL_API_KEY = process.env.RETRIEVAL_API_KEY;
const DEFAULT_TOP_K = Number(process.env.RETRIEVAL_DEFAULT_TOP_K) || 8;
const DEFAULT_THRESHOLD = Number(process.env.RETRIEVAL_DEFAULT_THRESHOLD) || 0.75;
const DEFAULT_TIMEOUT_MS = Number(process.env.RETRIEVAL_TIMEOUT_MS) || 15000;

function getClient() {
  if (!RETRIEVAL_API_URL) {
    throw new Error(
      'RETRIEVAL_API_URL is not configured. Set it in your .env to point at your retrieval backend.',
    );
  }
  return axios.create({
    baseURL: RETRIEVAL_API_URL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: RETRIEVAL_API_KEY ? { Authorization: `Bearer ${RETRIEVAL_API_KEY}` } : {},
  });
}

async function performRetrievalSearch({ query, topK, similarityThreshold, corpus, settings }) {
  const client = getClient();
  const body = {
    query,
    top_k: topK ?? settings?.topK ?? DEFAULT_TOP_K,
    similarity_threshold: similarityThreshold ?? settings?.similarityThreshold ?? DEFAULT_THRESHOLD,
    corpus: corpus || settings?.corpus || undefined,
  };
  try {
    const { data } = await client.post('/search', body);
    return data;
  } catch (err) {
    logger.error('[RetrievalService] search failed:', err?.response?.data || err.message);
    throw new Error('Retrieval backend search request failed');
  }
}

async function getNode(nodeId) {
  const client = getClient();
  try {
    const { data } = await client.get(`/nodes/${encodeURIComponent(nodeId)}`);
    return data;
  } catch (err) {
    logger.error('[RetrievalService] getNode failed:', err?.response?.data || err.message);
    throw new Error('Retrieval backend node lookup failed');
  }
}

async function getNodeNeighbors(nodeId, depth = 1) {
  const client = getClient();
  try {
    const { data } = await client.get(`/nodes/${encodeURIComponent(nodeId)}/neighbors`, {
      params: { depth },
    });
    return data;
  } catch (err) {
    logger.error('[RetrievalService] getNodeNeighbors failed:', err?.response?.data || err.message);
    throw new Error('Retrieval backend neighbor lookup failed');
  }
}

module.exports = { performRetrievalSearch, getNode, getNodeNeighbors };
