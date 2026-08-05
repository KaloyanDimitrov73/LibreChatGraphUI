const { logger } = require('~/config');
const { getGraph, getNode } = require('../services/GraphService');

const getGraphData = async (req, res) => {
  try {
    res.status(200).json(await getGraph());
  } catch (error) {
    logger.error('[GraphController] getGraphData error', error);
    res.status(500).json({ message: 'Failed to load graph data' });
  }
};

const getGraphNode = async (req, res) => {
  try {
    const node = await getNode(req.params.nodeId);
    if (!node) return res.status(404).json({ message: 'Node not found' });
    res.status(200).json(node);
  } catch (error) {
    logger.error('[GraphController] getGraphNode error', error);
    res.status(500).json({ message: 'Failed to load node' });
  }
};

module.exports = { getGraphData, getGraphNode };
