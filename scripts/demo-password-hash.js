const path = require("path");
const bcrypt = require(path.join(__dirname, "../server/node_modules/bcryptjs"));

async function demonstratePasswordHashing() {
    console.log("==========================================================");
    console.log(" HOSTELFIX DATA SECURITY: SALTED PASSWORD HASHING (Q2.a)");
    console.log("==========================================================");

    const plainPassword = "StudentPass2024!";
    const saltRounds = 10;

    console.log(`\n1. Plain-text password submitted by student: "${plainPassword}"`);

    // Insecure storage representation (BEFORE)
    const insecureDocument = {
        _id: "6614a8b2f1234567890abcde",
        name: "Aarav Sharma",
        email: "aarav.sharma@hostel.edu",
        password: plainPassword, // VULNERABILITY: Plain text exposed
        role: "student",
        roomNumber: "B-304",
        phone: "+91 98765 43210",
        createdAt: "2024-03-01T10:00:00.000Z"
    };

    console.log("\n--- [BEFORE] INSECURE DATABASE RECORD (PLAIN TEXT) ---");
    console.log(JSON.stringify(insecureDocument, null, 2));

    // Generating cryptographic salt and salted hash
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Secure storage representation (AFTER)
    const secureDocument = {
        _id: "6614a8b2f1234567890abcde",
        name: "Aarav Sharma",
        email: "aarav.sharma@hostel.edu",
        password: hashedPassword, // SECURED: Salted bcrypt hash
        role: "student",
        roomNumber: "B-304",
        phone: "+91 98765 43210",
        isMfaEnabled: true,
        createdAt: "2024-03-01T10:00:00.000Z"
    };

    console.log("\n--- [AFTER] SECURED DATABASE RECORD (SALTED BCRYPT HASH) ---");
    console.log(JSON.stringify(secureDocument, null, 2));

    console.log("\n--- BCRYPT STRUCTURE BREAKDOWN ---");
    console.log(` Full Hash: ${hashedPassword}`);
    console.log(` Algorithm Identifier: $2b$ (bcrypt revision 2b)`);
    console.log(` Cost Factor         : $10$ (2^10 = 1,024 key derivation rounds)`);
    console.log(` Cryptographic Salt  : ${hashedPassword.substring(7, 29)} (22 characters random salt)`);
    console.log(` Cipher Hash Part    : ${hashedPassword.substring(29)} (31 characters output)`);
    console.log("==========================================================\n");
}

demonstratePasswordHashing();
