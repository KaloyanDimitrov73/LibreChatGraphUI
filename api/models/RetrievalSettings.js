const mongoose = require('mongoose');

const RetrievalSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, unique: true },
  topK: { type: Number, default: 5 },
  similarityThreshold: { type: Number, default: 0.7 },
  corpus: { type: String, default: 'default' },
  autoRetrieve: { type: Boolean, default: true },
  llmModel: { type: String, default: '' }, // optional model override
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RetrievalSettings', RetrievalSettingsSchema);
