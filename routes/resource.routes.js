import express from "express";
import { fetchResources } from "../controllers/resource.controller.js";

const router = express.Router();

router.get("/", fetchResources);

export default router;