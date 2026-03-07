import express from "express";
import { getPublicProfile } from "../controllers/profile.controller.js";

const router = express.Router();

router.get("/:email", getPublicProfile);

export default router;