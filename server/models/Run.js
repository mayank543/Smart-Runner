// server/models/Run.js
import mongoose from "mongoose";

const runSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: Date, default: Date.now },
  distance: Number,         // in km
  averageSpeed: Number,     // in km/h
  duration: Number,         // in seconds
  path: [                   // list of GPS points
    {
      lat: Number,
      lng: Number,
      timestamp: Number,
    },
  ],
});

export default mongoose.model("Run", runSchema);