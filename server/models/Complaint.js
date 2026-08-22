const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        category: {
            type: String,
            enum: [
                "Electrical",
                "Plumbing",
                "Furniture",
                "Cleaning",
                "Internet",
                "Other"
            ],
            required: true
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium"
        },

        roomNumber: {
            type: String,
            required: true
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Assigned",
                "In Progress",
                "Resolved"
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Complaint", complaintSchema);