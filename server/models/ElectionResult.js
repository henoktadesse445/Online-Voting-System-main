const mongoose = require("mongoose");

const electionResultSchema = new mongoose.Schema({
    electionTitle: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    totalVotes: {
        type: Number,
        required: true,
        default: 0,
    },
    // Snapshot of candidates and their results
    results: [{
        candidateId: {
            type: mongoose.Schema.Types.ObjectId, // Reference to original user (optional, strictly for link)
            ref: "User"
        },
        name: { type: String, required: true },
        party: String,
        department: String,
        position: String, // The position they won or ran for
        votes: { type: Number, required: true },
        img: String, // Snapshot of image URL
        symbol: String // Snapshot of symbol URL
    }],
    archivedAt: {
        type: Date,
        default: Date.now,
    },
    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("ElectionResult", electionResultSchema);
