const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const { getGraphData, getGraphNode } = require('~/server/controllers/GraphController');

const router = express.Router();

// Same auth as the rest of the authenticated API surface; drop this line if the data should be public.
router.use(requireJwtAuth);

router.get('/', getGraphData);
router.get('/nodes/:nodeId', getGraphNode);

module.exports = router;
