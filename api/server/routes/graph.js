const express = require('express');
const RetrievalService = require('../services/RetrievalService');
const GraphService = require('../services/GraphService');

const router = express.Router();

// Root/overview endpoint used by "View in graph" — must come before the
// generic '/node/:id' route below or "root" would be treated as a node id.
router.get('/node/root', async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.query;
    const graph = await GraphService.getGraph({ conversationId, messageId });
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

// ---- Node CRUD ---------------------------------------------------------
// These operate on the local in-memory demo graph (GraphService), not the
// external retrieval backend — there's no remote equivalent for authoring
// yet, so editing always works against local state regardless of whether
// RETRIEVAL_API_URL is configured.

router.post('/nodes', async (req, res, next) => {
  try {
    const node = await GraphService.createNode(req.body || {});
    res.status(201).json(node);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/nodes/:id', async (req, res, next) => {
  try {
    const node = await GraphService.updateNode(req.params.id, req.body || {});
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json(node);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/nodes/:id', async (req, res, next) => {
  try {
    const deleted = await GraphService.deleteNode(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Node not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ---- Edge CRUD -----------------------------------------------------------

router.post('/edges', async (req, res, next) => {
  try {
    const { source, target, label } = req.body || {};
    const edge = await GraphService.createEdge({ source, target, label });
    res.status(201).json(edge);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/edges/:id', async (req, res, next) => {
  try {
    const deleted = await GraphService.deleteEdge(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Edge not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
