// server/routes/api.js
const express = require('express');
const mongoose = require('mongoose')
const router = express.Router();
const Paste = require('../model/paste.model');
const { getExpiresAt } = require('../utils/time');
const { loadAndPasteLink } = require('../utils/loadAndPaste')
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
    const { content, ttl_seconds, max_views, view_count } = req.body;

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
      content: content,
      ttl_seconds: ttl_seconds,
      max_views: max_views,
      view_count: view_count,
      createdAt: Date.now()
    });

    await paste.save();

    const url = `${process.env.BASE_URL || req.protocol + '://' + req.get('host')}/p/${id}`;
    res.status(201).json({ id, url });
  } catch (error) {
    console.log('Error creating paste: ', error)
    res.status(500).json({ error: 'Internal server error', error: error });
  }
});

// Fetch paste (API)
router.get('/pastes/:id', async (req, res) => {
  try {
    const result = await loadAndPasteLink(req);
   
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.msg });
    }

    const paste = result.paste;
    res.json({
      content: paste.content,
      remaining_views: paste.max_views ? paste.max_views - paste.view_count : null,
      expires_at: getExpiresAt(paste),
      view_count: paste.view_count
    });
    
  } catch (error) {
    console.log('Error fetching paste: ', error)
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;