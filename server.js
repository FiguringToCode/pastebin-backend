const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const Paste = require('./model/paste.model')
const { initializeDatabase } = require('./db/db.connect')
const { getCurrentTime, getExpiresAt, isExpired } = require('./utils/time')
const { loadPasteAndIncrement } = require('./utils/loadAndPaste')

const app = express();
initializeDatabase()

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// HTML view route (add the /p/:id route here) for serving paste HTML
app.get('/p/:id', async (req, res) => {
  try {
    const result = await loadPasteAndIncrement(req);
    
    if (result.error) {
      const msg = result.error.msg;
      return res.status(result.error.status).send(`<h1>404 - ${msg}</h1>`);
    }

    const paste = result.paste;

      // Escape HTML to prevent XSS
      const escapedContent = paste.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
  
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Paste</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { background: #f4f4f4; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1 style="margin-top: 1rem;">Paste</h1>
            <pre style="text-align: center;">${escapedContent}</pre>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send('<h1>500 - Internal Server Error</h1>');
    }
  });


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});