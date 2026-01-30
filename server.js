const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const Paste = require('./model/paste.model')
const { initializeDatabase } = require('./db/db.connect')
const { getCurrentTime, getExpiresAt, isExpired } = require('./utils/time')

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
      const paste = await Paste.findById(req.params.id);
      
      if (!paste) {
        return res.status(404).send('<h1>404 - Paste Not Found</h1>');
      }
  
      const currentTime = getCurrentTime(req);
  
      if (isExpired(paste, currentTime)) {
        return res.status(404).send('<h1>404 - Paste Expired</h1>');
      }
  
      if (paste.max_views && paste.view_count >= paste.max_views) {
        return res.status(404).send('<h1>404 - View Limit Exceeded</h1>');
      }
  
  
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
            <h1>Paste</h1>
            <pre>${escapedContent}</pre>
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