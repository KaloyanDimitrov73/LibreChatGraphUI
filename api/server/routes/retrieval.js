const express = require('express');
const RetrievalService = require('../services/RetrievalService');

const router = express.Router();

// POST /api/retrieval/search
router.post('/search', async (req, res, next) => {
  try {
    const { query, ...opts } = req.body || {};
    const result = await RetrievalService.search(query, opts);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/retrieval/ask
router.post('/ask', async (req, res, next) => {
  try {
    const { question, ...opts } = req.body || {};
    const result = await RetrievalService.ask(question, opts);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/retrieval/ask/stream -> streams back; for now we proxy as plain-stream
router.post('/ask/stream', async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    await RetrievalService.askStream(req.body.question, req.body.options || {}, (chunk) => {
      res.write(`data: ${chunk}\n\n`);
    });
    res.end();
  } catch (err) {
    next(err);
  }
});

// GET /api/retrieval/node/:id
router.get('/node/:id', async (req, res, next) => {
  try {
    const node = await RetrievalService.getNode(req.params.id);
    res.json(node);
  } catch (err) {
    next(err);
  }
});

// POST /api/retrieval/node/:id/neighbors
router.post('/node/:id/neighbors', async (req, res, next) => {
  try {
    const neighbors = await RetrievalService.getNeighbors(req.params.id, req.body || {});
    res.json(neighbors);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
