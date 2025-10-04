import express from "express";
import cors from "cors";
import { initAzure } from "./config/azureBlob.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Import background processor (using dynamic import since it uses CommonJS)
let backgroundProcessor;
(async () => {
  const { default: processor } = await import('./services/backgroundProcessor.js');
  backgroundProcessor = processor;
})();

const app = express();
await initAzure();  // ✅ initialize Azure Blob container

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

// Add background processor status endpoint
app.get('/api/system/status', (req, res) => {
  try {
    const status = backgroundProcessor ? backgroundProcessor.getStatus() : { error: 'Background processor not initialized' };
    res.json({
      server: 'running',
      timestamp: new Date().toISOString(),
      backgroundProcessor: status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add manual processor trigger endpoint (for testing)
app.post('/api/system/process-manual', async (req, res) => {
  try {
    if (!backgroundProcessor) {
      return res.status(503).json({ error: 'Background processor not initialized' });
    }
    
    await backgroundProcessor.runManualCheck();
    res.json({ message: 'Manual processing completed', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Start background processor after server starts
  setTimeout(() => {
    if (backgroundProcessor) {
      backgroundProcessor.start();
      console.log('🔄 Background processor started automatically');
    } else {
      console.log('⚠️ Background processor not available yet');
    }
  }, 2000); // Give it 2 seconds to initialize
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  
  if (backgroundProcessor) {
    backgroundProcessor.stop();
  }
  
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📴 Received SIGINT, shutting down gracefully');
  
  if (backgroundProcessor) {
    backgroundProcessor.stop();
  }
  
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});
