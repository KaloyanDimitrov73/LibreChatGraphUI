const express = require('express');
const RetrievalService = require('../services/RetrievalService');
const { getGraph } = require('../services/GraphService');

const router = express.Router();

// Root/overview endpoint used by "View in graph" — must come before the
// generic '/node/:id' route below or "root" would be treated as a node id.
router.get('/node/root', async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.query;
    const graph = await getGraph({ conversationId, messageId });
    res.json(graph);
  } catch (err) {
    next(err);
  }
});

// Minimal graph endpoints used by the UI to load nodes/neighbors
router.get('/node/:id', async (req, res, next) => {
  try {
    const node = await RetrievalService.getNode(req.params.id);
    res.json(node);
  } catch (err) {
    next(err);
  }
});

router.post('/node/:id/neighbors', async (req, res, next) => {
  try {
    const neighbors = await RetrievalService.getNeighbors(req.params.id, req.body || {});
    res.json(neighbors);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
