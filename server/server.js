const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const os = require("os");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const staffRoutes = require("./routes/staffRoutes");

const app = express();

const INSTANCE_ID = process.env.INSTANCE_ID || `HostelFix-Node-${os.hostname()}`;

app.use(cors());
app.use(express.json());

// Identify which backend instance handled the request (for load balancing verification)
app.use((req, res, next) => {
    res.setHeader("X-Backend-Instance", INSTANCE_ID);
    res.setHeader("X-Server-Hostname", os.hostname());
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/staff", staffRoutes);

// Health check endpoint for load balancers & monitoring
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        instance: INSTANCE_ID,
        hostname: os.hostname(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    res.json({
        message: "HostelFix API is running!",
        instance: INSTANCE_ID,
        hostname: os.hostname()
    });
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log(`[${INSTANCE_ID}] MongoDB connected successfully`);

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`[${INSTANCE_ID}] Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error(`[${INSTANCE_ID}] MongoDB connection failed:`, error);
    });