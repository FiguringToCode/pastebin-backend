const mongoose = require('mongoose')

const PasteSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    content: { type: String, required: true },
    ttl_seconds: { type: Number, min: 1, default: null },
    max_views: { type: Number, min: 1, default: null },
    view_count: { type: Number, default: 0, required: true },
    createdAt: { type: Number, required: true, default: Date.now }
})

PasteSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 0,
    partialFilterExpression: { ttl_seconds: { $exist: true } }
})

module.exports = mongoose.model('Paste', PasteSchema) 