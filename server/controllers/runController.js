// server/controllers/runController.js
import Run from "../models/Run.js";

export const createRun = async (req, res) => {
  const userId = req.user;
  const { distance, averageSpeed, duration, path } = req.body;

  try {
    const run = await Run.create({
      userId,
      distance,
      averageSpeed,
      duration,
      path,
    });
    res.status(201).json(run);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getRuns = async (req, res) => {
  const userId = req.user;
  try {
    const runs = await Run.find({ userId }).sort({ date: -1 });
    res.status(200).json(runs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};