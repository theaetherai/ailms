// This is a minimal fallback server if Next.js standalone build fails
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

// Try to load next
let next;
let app;
let handle;

try {
  next = require('next');
  app = next({ dev: false });
  handle = app.getRequestHandler();
  console.log('Successfully loaded Next.js');
} catch (error) {
  console.error('Failed to load Next.js:', error.message);
}

// Check if we're in the standalone directory
const isStandalone = fs.existsSync(path.join(__dirname, '.next/standalone'));
console.log(`Running in standalone mode: ${isStandalone}`);

// Start the server
const startServer = async () => {
  try {
    // If Next.js is available, use it
    if (app && handle) {
      await app.prepare();
      createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      }).listen(process.env.PORT || 3000, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${process.env.PORT || 3000}`);
      });
    } else {
      // Fallback to a simple server
      createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>App Server</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                h1 { color: #333; }
                .container { border: 1px solid #ddd; padding: 20px; border-radius: 5px; background: #f9f9f9; }
                .info { color: #0c5460; background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>Application Server</h1>
              <div class="container">
                <div class="info">
                  <h2>Server Running</h2>
                  <p>The server is running but Next.js could not be initialized.</p>
                </div>
                <p>This is a minimal server running because the Next.js application server could not be started.</p>
                <p>To access the application, please:</p>
                <ul>
                  <li>Check that all dependencies are installed</li>
                  <li>Verify that Next.js is correctly configured</li>
                  <li>Check the server logs for specific errors</li>
                </ul>
              </div>
            </body>
          </html>
        `);
      }).listen(process.env.PORT || 3000, () => {
        console.log(`> Fallback server ready on http://localhost:${process.env.PORT || 3000}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 