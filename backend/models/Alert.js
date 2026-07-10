const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    repo: { type: mongoose.Schema.Types.ObjectId, ref: 'Repo', required: true, index: true },
    type: { type: String, enum: ['down', 'recovered'], required: true },
    message: { type: String, required: true },
    channels: [{ type: String }], // e.g. ['discord', 'email']
    sentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);
