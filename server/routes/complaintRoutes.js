const express = require("express");
const Complaint = require("../models/Complaint");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

// CREATE complaint
router.post("/", protect, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            priority,
            roomNumber
        } = req.body;

        const complaint = new Complaint({
            title,
            description,
            category,
            priority,
            roomNumber,
            studentId: req.user.userId
        });

        const savedComplaint = await complaint.save();

        res.status(201).json(savedComplaint);

    } catch (error) {
        res.status(400).json({
            message: "Failed to create complaint",
            error: error.message
        });
    }
});
// GET one complaint
router.get("/:id", protect, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        // Verify authorization: must be the owner student or a staff member
        if (complaint.studentId.toString() !== req.user.userId && req.user.role !== "staff") {
            return res.status(403).json({
                message: "You are not authorized to view this complaint"
            });
        }

        res.status(200).json(complaint);

    } catch (error) {
        console.error("GET COMPLAINT ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch complaint",
            error: error.message
        });
    }
});
// UPDATE complaint (Restricted to staff/admin role e.g. supervisor/warden)
router.put("/:id", protect, authorizeRoles("staff", "admin"), async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.status(200).json(complaint);

    } catch (error) {
        res.status(400).json({
            message: "Failed to update complaint",
            error: error.message
        });
    }
});

// DELETE complaint (Restricted to admin/supervisor role)
router.delete("/:id", protect, authorizeRoles("admin", "staff"), async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndDelete(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.status(200).json({
            message: "Complaint deleted successfully",
            deletedId: req.params.id
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete complaint",
            error: error.message
        });
    }
});

// GET all complaints
router.get("/", protect, async (req, res) => {
    try {
        const complaints = await Complaint.find({ studentId: req.user.userId });

        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch complaints",
            error: error.message
        });
    }
});

module.exports = router;