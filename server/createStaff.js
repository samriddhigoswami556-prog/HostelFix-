const dns = require("dns");

dns.setServers(["8.8.8.8"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const createStaff = async () => {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const existingStaff = await User.findOne({
            email: "staff@hostelfix.com"
        });

        if (existingStaff) {

            console.log("Staff account already exists");

            process.exit();

        }

        const hashedPassword =
            await bcrypt.hash("Staff12345", 10);

        const staff = new User({
            name: "HostelFix Staff",
            email: "staff@hostelfix.com",
            password: hashedPassword,
            role: "staff",
            roomNumber: "",
            phone: ""
        });

        await staff.save();

        console.log("Staff account created successfully");

        process.exit();

    } catch (error) {

        console.error(error);

        process.exit(1);

    }
};

createStaff();