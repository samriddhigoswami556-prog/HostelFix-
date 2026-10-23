const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const demoUsers = [
    {
        name: "Aarav Sharma (Student)",
        email: "student@hostelfix.com",
        password: "Student12345",
        role: "student",
        roomNumber: "B-304",
        phone: "+91 98765 43210",
        isMfaEnabled: false
    },
    {
        name: "Priya Patel (Student)",
        email: "priya@hostelfix.com",
        password: "Student12345",
        role: "student",
        roomNumber: "A-102",
        phone: "+91 98765 12345",
        isMfaEnabled: false
    },
    {
        name: "Hostel Supervisor / Warden",
        email: "staff@hostelfix.com",
        password: "Staff12345",
        role: "staff",
        roomNumber: "Staff Office",
        phone: "+91 91234 56789",
        isMfaEnabled: false
    }
];

async function seedDemoUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB Atlas");

        for (const u of demoUsers) {
            const existing = await User.findOne({ email: u.email });
            const hashedPassword = await bcrypt.hash(u.password, 10);

            if (existing) {
                existing.password = hashedPassword;
                existing.role = u.role;
                existing.roomNumber = u.roomNumber;
                existing.name = u.name;
                await existing.save();
                console.log(`Updated demo account: ${u.email} (${u.role})`);
            } else {
                const user = new User({
                    name: u.name,
                    email: u.email,
                    password: hashedPassword,
                    role: u.role,
                    roomNumber: u.roomNumber,
                    phone: u.phone,
                    isMfaEnabled: false
                });
                await user.save();
                console.log(`Created demo account: ${u.email} (${u.role})`);
            }
        }

        console.log("\nAll demo accounts seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Failed to seed demo users:", err);
        process.exit(1);
    }
}

seedDemoUsers();
