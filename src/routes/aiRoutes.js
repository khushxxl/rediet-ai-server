const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/chat", aiController.chat);
router.post("/generate-health-report", aiController.generateHealthReport);
router.post("/food-info", aiController.analyzeFoodImage);
router.post("/macros", aiController.getMacros);
router.post("/diet-report", aiController.createDietReportUsingAudio);

module.exports = router;
