// server/server.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import runRoutes from "./routes/runRoutes.js";
import { requireAuth } from './middleware/requireAuth.js';

dotenv.config();

 const app = express();

const corsOptions = {
  origin: ['http://localhost:5173','https://smart-runner.vercel.app'], // Your frontend URL
  credentials: true, // Allow cookies/auth headers
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Add this line
app.use(express.json());

// Routes
app.use("/api/runs", runRoutes);
app.get('/api/runs', requireAuth, async (req, res) => {
  // req.user will contain the Clerk user ID
  // Fetch runs for this specific user
});

const PORT = process.env.PORT || 3000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));