/**
 * Server Entry Point
 * Application startup and server configuration
 */

require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/database');

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start server
    const server = app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     UK Business Mileage Tracker API                        ║
║                                                            ║
║     Server running on http://${HOST}:${PORT}              ║
║     Environment: ${process.env.NODE_ENV || 'development'}                            ║
║     API Base URL: http://${HOST}:${PORT}/api              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connection
        const { disconnect } = require('./config/database');
        await disconnect();
        
        console.log('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
