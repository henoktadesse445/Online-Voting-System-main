const User = require("../models/User");

/**
 * 🏆 Recalculates and assigns positions based on current vote totals.
 */
const recalculatePositions = async () => {
    const validPositions = [
        "President",
        "Vice President",
        "Secretary",
        "Finance Officer",
        "Public Relations Officer",
        "Sports & Recreation Officer",
        "Gender and Equality Officer"
    ];

    const candidates = await User.find({
        role: "candidate",
        approvalStatus: { $in: ["approved", null] }
    })
        .select("name party votes position")
        .sort({ votes: -1 });

    if (candidates.length === 0) return [];

    const assignments = [];
    for (let i = 0; i < Math.min(candidates.length, validPositions.length); i++) {
        const candidate = candidates[i];
        const position = validPositions[i];

        if (candidate.position !== position) {
            await User.findByIdAndUpdate(candidate._id, { position: position });
        }

        assignments.push({
            position: position,
            candidate: {
                name: candidate.name,
                votes: candidate.votes || 0,
                _id: candidate._id
            }
        });
    }

    if (candidates.length > validPositions.length) {
        const remainingCandidates = candidates.slice(validPositions.length);
        for (const candidate of remainingCandidates) {
            if (candidate.position !== null) {
                await User.findByIdAndUpdate(candidate._id, { position: null });
            }
        }
    }

    return assignments;
};

module.exports = {
    recalculatePositions
};
