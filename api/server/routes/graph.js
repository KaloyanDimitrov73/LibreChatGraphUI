const express = require('express');
const RetrievalService = require('../services/RetrievalService');

const router = express.Router();

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
