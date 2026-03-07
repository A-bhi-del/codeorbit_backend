import express from "express";
import { getContests } from "../controllers/contest.controller.js";

const router = express.Router();

router.get("/", getContests);

export default router;