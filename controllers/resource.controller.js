import { getResources } from "../services/resource.service.js";

export const fetchResources = (req, res) => {

  try {

    const resources = getResources();

    res.json(resources);

  } catch (error) {

    res.status(500).json({
      message: "Error fetching resources"
    });

  }

};