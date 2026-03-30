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
    // Start server first (so health checks pass)
    const server = app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     UK Business Mileage Tracker API                        ║
║                                                            ║
║     Server running on http://${HOST}:${PORT}              
║     Environment: ${process.env.NODE_ENV || 'development'}                            
║     API Base URL: http://${HOST}:${PORT}/api              
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Try to connect to database with retries
    let isConnected = false;
    let retries = 0;
    const maxRetries = 5;
    
    while (!isConnected && retries < maxRetries) {
      isConnected = await testConnection();
      if (!isConnected) {
        retries++;
        console.log(`Database connection failed, retrying... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (!isConnected) {
      console.error('Warning: Database connection failed after retries. Some features may not work.');
    } else {
      console.log('✅ Database connected successfully');
    }

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
