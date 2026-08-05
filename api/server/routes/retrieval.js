const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const RetrievalSettings = require('~/models/RetrievalSettings');
const {
  performRetrievalSearch,
  getNode,
  getNodeNeighbors,
} = require('~/server/services/RetrievalService');

const router = express.Router();
router.use(requireJwtAuth);

router.get('/settings', async (req, res) => {
  try {
    let settings = await RetrievalSettings.findOne({ user: req.user.id });
    if (!settings) {
      settings = await RetrievalSettings.create({ user: req.user.id });
    }
    res.status(200).json(settings);
  } catch (err) {
    logger.error('[/api/retrieval/settings GET]', err);
    res.status(500).json({ error: 'Failed to load retrieval settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { topK, similarityThreshold, corpus, autoRetrieve } = req.body ?? {};
    const update = {};
    if (topK !== undefined) update.topK = topK;
    if (similarityThreshold !== undefined) update.similarityThreshold = similarityThreshold;
    if (corpus !== undefined) update.corpus = corpus;
    if (autoRetrieve !== undefined) update.autoRetrieve = autoRetrieve;

    const settings = await RetrievalSettings.findOneAndUpdate(
      { user: req.user.id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.status(200).json(settings);
  } catch (err) {
    logger.error('[/api/retrieval/settings PUT]', err);
    res.status(400).json({ error: 'Failed to update retrieval settings' });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { query, topK, similarityThreshold, corpus } = req.body ?? {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }
    const settings = await RetrievalSettings.findOne({ user: req.user.id });
    const results = await performRetrievalSearch({ query, topK, similarityThreshold, corpus, settings });
    res.status(200).json(results);
  } catch (err) {
    logger.error('[/api/retrieval/search POST]', err);
    res.status(502).json({ error: err.message || 'Retrieval backend request failed' });
  }
});

router.get('/node/:id', async (req, res) => {
  try {
    const node = await getNode(req.params.id);
    res.status(200).json(node);
  } catch (err) {
    logger.error('[/api/retrieval/node/:id GET]', err);
    res.status(502).json({ error: 'Failed to load node detail' });
  }
});

router.get('/node/:id/neighbors', async (req, res) => {
  try {
    const depth = req.query.depth ? Number(req.query.depth) : 1;
    const neighbors = await getNodeNeighbors(req.params.id, depth);
    res.status(200).json(neighbors);
  } catch (err) {
    logger.error('[/api/retrieval/node/:id/neighbors GET]', err);
    res.status(502).json({ error: 'Failed to load node neighbors' });
  }
});

module.exports = router;
