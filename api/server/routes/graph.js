const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const GraphService = require('../services/GraphService');

const router = express.Router();
router.use(requireJwtAuth);

function sendError(res, err) {
  res.status(err.status || 500).json({ error: err.message });
}

// Graph HubLink retrieved for an answer; opened by "View in graph" under it.
router.get('/node/root', async (req, res) => {
  try {
    res.json(await GraphService.getGraph({ messageId: req.query.messageId }));
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/node/:id/neighbors', async (req, res) => {
  try {
    res.json(await GraphService.getNeighbors(req.params.id));
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
