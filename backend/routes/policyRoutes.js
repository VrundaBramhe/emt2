const express = require("express");
const router = express.Router();
const { getPolicies, upsertPolicy } = require("../controllers/policyController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", protect, getPolicies);
router.put("/:category", protect, adminOnly, upsertPolicy);

module.exports = router;
