const mongoose = require('mongoose');

/**
 * Per-user settings for the custom graph/paper retrieval backend.
 * One document per user; created lazily on first GET /api/retrieval/settings.
 */
const retrievalSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    topK: { type: Number, default: 8, min: 1, max: 50 },
    similarityThreshold: { type: Number, default: 0.75, min: 0, max: 1 },
    corpus: { type: String, default: '', trim: true },
    autoRetrieve: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.RetrievalSettings || mongoose.model('RetrievalSettings', retrievalSettingsSchema);
