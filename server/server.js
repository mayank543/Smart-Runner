// server/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { requireAuth } from './middleware/requireAuth.js';

dotenv.config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:5173', 'https://smart-runner.vercel.app'], // Your frontend URL
  credentials: true, // Allow cookies/auth headers
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Add this line
app.use(express.json());

// Routes
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Smart Runner Server is running (MongoDB disabled)');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});