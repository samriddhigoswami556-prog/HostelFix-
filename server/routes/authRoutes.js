const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateSecret, generateURI, verifySync } = require("otplib");
const qrcode = require("qrcode");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            roomNumber,
            phone
        } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // Salted password hashing (bcrypt with salt rounds = 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            roomNumber,
            phone,
            role: "student",
            isMfaEnabled: false,
            mfaSecret: null
        });

        await user.save();

        res.status(201).json({
            message: "Registration successful"
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

// LOGIN (Supports Password Verification + TOTP 2FA)
router.post("/login", async (req, res) => {
    try {
        const { email, password, totpCode } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        // If Multi-Factor Authentication is enabled for this user
        if (user.isMfaEnabled) {
            if (!totpCode) {
                return res.status(200).json({
                    mfaRequired: true,
                    email: user.email,
                    message: "Two-factor authentication required. Please enter code from Google/Microsoft Authenticator"
                });
            }

            const isTotpValid = verifySync({
                token: String(totpCode).trim(),
                secret: user.mfaSecret
            });

            if (!isTotpValid || !isTotpValid.valid) {
                return res.status(400).json({
                    message: "Invalid Authenticator code. Please check your authenticator app and try again."
                });
            }
        }

        // Successful authentication (Password + optional MFA verified)
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roomNumber: user.roomNumber,
                isMfaEnabled: user.isMfaEnabled
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

// GET CURRENT USER PROFILE & MFA STATUS
router.get("/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user profile", error: error.message });
    }
});

// SETUP MFA (Generate Secret + QR Code for Google/Microsoft Authenticator)
router.post("/mfa/setup", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const secret = generateSecret();
        const otpauthUri = generateURI({
            issuer: "HostelFix",
            label: user.email,
            secret: secret
        });

        const qrCodeDataUrl = await qrcode.toDataURL(otpauthUri);

        // Temporarily store secret in user document until verified
        user.mfaSecret = secret;
        await user.save();

        res.json({
            message: "MFA setup initiated. Scan QR code in Google or Microsoft Authenticator.",
            secret: secret,
            qrCode: qrCodeDataUrl
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to setup MFA",
            error: error.message
        });
    }
});

// VERIFY AND ACTIVATE MFA
router.post("/mfa/verify", protect, async (req, res) => {
    try {
        const { totpCode } = req.body;
        if (!totpCode) {
            return res.status(400).json({ message: "TOTP code is required" });
        }

        const user = await User.findById(req.user.userId);
        if (!user || !user.mfaSecret) {
            return res.status(400).json({ message: "MFA setup has not been initiated" });
        }

        const verification = verifySync({
            token: String(totpCode).trim(),
            secret: user.mfaSecret
        });

        if (!verification || !verification.valid) {
            return res.status(400).json({ message: "Invalid verification code. Please try again." });
        }

        user.isMfaEnabled = true;
        await user.save();

        res.json({
            message: "Multi-Factor Authentication enabled successfully!",
            isMfaEnabled: true
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to verify MFA",
            error: error.message
        });
    }
});

// DISABLE MFA
router.post("/mfa/disable", protect, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        user.isMfaEnabled = false;
        user.mfaSecret = null;
        await user.save();

        res.json({
            message: "Two-factor authentication disabled successfully",
            isMfaEnabled: false
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to disable MFA", error: error.message });
    }
});

router.get("/test", (req, res) => {
    res.json({
        message: "Auth routes are working!",
        instance: process.env.INSTANCE_ID || "standalone"
    });
});

module.exports = router;