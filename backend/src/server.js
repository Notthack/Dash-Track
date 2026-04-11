/**
 * server.js — Application entry point.
 * 
 * Initializes the Dash Platform connection (if enabled),
 * then starts the Express HTTP server.
 */
const dashClient = require('./config/dashClient');
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function start() {
  // Initialize Dash Platform (logs connection status for demo)
  await dashClient.initialize();

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}/index.html`);
    console.log(`Scanner:  http://localhost:${PORT}/scanner.html\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
