// server/routes/api.js
const express = require('express');
const mongoose = require('mongoose')
const router = express.Router();
const Paste = require('../model/paste.model');
const { getCurrentTime, isExpired, getExpiresAt } = require('../utils/time');
const { nanoid } = require('nanoid'); // npm install nanoid

// Health check
router.get('/healthz', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

// Create paste
router.post('/pastes', async (req, res) => {
  try {
    const { content, ttl_seconds, max_views } = req.body;

    // Validation
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required and must be non-empty' });
    }
    if (ttl_seconds !== undefined && (typeof ttl_seconds !== 'number' || ttl_seconds < 1)) {
      return res.status(400).json({ error: 'ttl_seconds must be an integer >= 1' });
    }
    if (max_views !== undefined && (typeof max_views !== 'number' || max_views < 1)) {
      return res.status(400).json({ error: 'max_views must be an integer >= 1' });
    }

    const id = nanoid(10);
    const paste = new Paste({
      _id: id,
      content,
      ttl_seconds: ttl_seconds,
      max_views: max_views,
      createdAt: Date.now()
    });

    await paste.save();

    const url = `${process.env.BASE_URL || req.protocol + '://' + req.get('host')}/p/${id}`;
    res.status(201).json({ id, url });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch paste (API)
router.get('/pastes/:id', async (req, res) => {
  try {
    const paste = await Paste.findById(req.params.id);
    
    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }

    const currentTime = getCurrentTime(req);

    // Check expiry
    if (isExpired(paste, currentTime)) {
      return res.status(404).json({ error: 'Paste expired' });
    }

    // Check view limit BEFORE incrementing
    if (paste.maxViews && paste.viewCount >= paste.maxViews) {
      return res.status(404).json({ error: 'View limit exceeded' });
    }

    // Increment view count atomically
    const updated = await Paste.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    const response = {
      content: updated.content,
      remaining_views: updated.maxViews ? updated.maxViews - updated.viewCount : null,
      expires_at: getExpiresAt(updated)
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;