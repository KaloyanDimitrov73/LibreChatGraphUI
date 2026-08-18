const { StructuredTool } = require('@librechat/agents/langchain/tools');
const { z } = require('zod');
const { logger } = require('~/config');
const { performRetrievalSearch } = require('~/server/services/RetrievalService');

class GraphRetrieval extends StructuredTool {
  static lc_name() {
    return 'GraphRetrieval';
  }

  name = 'graph_retrieval';

  description =
    'Searches the science-paper knowledge graph backend for papers/nodes relevant to a query. ' +
    'Use this whenever the user asks a research question that could be answered by literature ' +
    'or graph data rather than general knowledge. Returns titles, authors, snippets, and node IDs ' +
    'that can be looked up further or shown on the graph view.';

  schema = z.object({
    query: z.string().describe('The research question or topic to search for in the knowledge graph.'),
    topK: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Number of results to retrieve. Defaults to the user's configured setting."),
    corpus: z
      .string()
      .optional()
      .describe('Optional corpus/collection filter, e.g. a subject area or dataset name.'),
  });

  constructor(fields = {}) {
    super();
    this.userId = fields.userId;
  }

  async _call({ query, topK, corpus }) {
    try {
      const data = await performRetrievalSearch({ query, topK, corpus });
      return formatResultsForLLM(data);
    } catch (err) {
      logger.error('[GraphRetrieval] tool error:', err);
      return `Retrieval backend error: ${err.message}. Let the user know retrieval is currently unavailable.`;
    }
  }
}

function formatResultsForLLM(data) {
  const results = Array.isArray(data?.results) ? data.results : [];
  if (results.length === 0) {
    return 'No relevant papers/nodes were found for this query.';
  }
  const lines = results.map((r, i) => {
    const authors = Array.isArray(r.authors) ? r.authors.join(', ') : r.authors;
    const parts = [
      `${i + 1}. [node:${r.id}] ${r.title ?? 'Untitled'}`,
      authors ? `   Authors: ${authors}` : null,
      typeof r.score === 'number' ? `   Relevance: ${r.score.toFixed(2)}` : null,
      r.snippet ? `   Excerpt: ${r.snippet}` : null,
      r.url ? `   URL: ${r.url}` : null,
    ].filter(Boolean);
    return parts.join('\n');
  });
  return lines.join('\n\n');
}

module.exports = GraphRetrieval;
