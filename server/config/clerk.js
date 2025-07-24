// server/config/clerk.js
import { createClerkClient } from '@clerk/clerk-sdk-node';

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});