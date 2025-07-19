// server/middleware/requireAuth.js
import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.decode(token); // Clerk uses JWT-based session tokens
    req.user = decoded.sub; // userId from Clerk
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};