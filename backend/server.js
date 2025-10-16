import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initAzure } from "./config/azureBlob.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

const startServer = async () => {
  try {
    // Initialize Azure Blob Storage
    await initAzure();

    const app = express();
    app.use(cors());
    app.use(express.json());

    // API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/expenses", expenseRoutes);

    // ✅ Setup for serving React frontend
    const __filename = fileURLToPath(import.meta.url);
    const _dirname = path.dirname(_filename);

    if (process.env.NODE_ENV === "production") {
      // Serve static files from React build folder
      app.use(express.static(path.join(__dirname, "../frontend/build")));

      // Serve index.html for all unmatched routes (React Router)
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../frontend/build", "index.html"));
      });
    }

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(🚀 Server running on port ${PORT}));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();
