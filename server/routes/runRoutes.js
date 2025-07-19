// server/routes/runRoutes.js
import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createRun,
  getRuns,
} from "../controllers/runController.js";

const router = express.Router();

router.use(requireAuth); // protect all routes

router.post("/", createRun);
router.get("/", getRuns);

export default router;