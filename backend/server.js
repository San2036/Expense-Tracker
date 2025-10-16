import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initAzure } from "./config/azureBlob.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

// Azure Blob initialization
await initAzure();

// Serve React frontend in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../frontend/build", "index.html"))
  );
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
