const Policy = require("../models/Policy");

// @desc Get all policies
// @route GET /api/policies
const getPolicies = async (req, res) => {
    try {
        const policies = await Policy.find().sort({ category: 1 });
        res.json(policies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Admin: create or update a policy (upsert by category)
// @route PUT /api/policies/:category
const upsertPolicy = async (req, res) => {
    try {
        const { category } = req.params;
        const { maxAmountPerExpense, description } = req.body;

        const policy = await Policy.findOneAndUpdate(
            { category },
            { maxAmountPerExpense, description },
            { new: true, upsert: true, runValidators: true }
        );

        res.json(policy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPolicies, upsertPolicy };