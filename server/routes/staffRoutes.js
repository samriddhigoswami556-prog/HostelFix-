const express = require("express");
const Complaint = require("../models/Complaint");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// GET ALL COMPLAINTS
router.get(
    "/complaints",
    protect,
    allowRoles("staff"),
    async (req, res) => {

        try {

            const complaints = await Complaint.find()
                .sort({ createdAt: -1 });

            res.status(200).json(complaints);

        } catch (error) {

            res.status(500).json({
                message: "Failed to fetch complaints",
                error: error.message
            });

        }
    }
);


// UPDATE COMPLAINT STATUS
router.put(
    "/complaints/:id/status",
    protect,
    allowRoles("staff"),
    async (req, res) => {

        try {

            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "In Progress",
                "Resolved"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid status"
                });
            }

            const complaint =
                await Complaint.findByIdAndUpdate(
                    req.params.id,
                    { status },
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

            res.status(500).json({
                message: "Failed to update complaint",
                error: error.message
            });

        }
    }
);


module.exports = router;