const path = require("path");
const http = require("http");
const { generateSync } = require(path.join(__dirname, "../server/node_modules/otplib"));

const BASE_URL = process.env.TEST_URL || "http://localhost:5000";

function makeRequest(method, endpoint, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const data = body ? JSON.stringify(body) : "";

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                "Content-Type": "application/json",
                ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
        };

        const req = http.request(options, (res) => {
            let resData = "";
            res.on("data", (chunk) => { resData += chunk; });
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(resData);
                } catch {
                    parsed = resData;
                }
                resolve({ status: res.statusCode, data: parsed, headers: res.headers });
            });
        });

        req.on("error", reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runSecurityTests() {
    console.log("==========================================================");
    console.log(" HOSTELFIX API SECURITY & RBAC VERIFICATION SUITE");
    console.log("==========================================================");

    const testEmail = `student_${Date.now()}@hostel.edu`;
    const testPassword = "Password123!";

    // 1. Unauthenticated Request Rejection (Q2.b)
    console.log("\n[TEST 1] Request without valid token (Expected: 401 Unauthorized)");
    const unauthRes = await makeRequest("DELETE", "/api/complaints/6614a8b2f1234567890abcde");
    console.log(` Status: ${unauthRes.status}`);
    console.log(` Response:`, unauthRes.data);

    // 2. Register Student
    console.log(`\n[TEST 2] Registering test student: ${testEmail}`);
    const regRes = await makeRequest("POST", "/api/auth/register", {
        name: "Security Test Student",
        email: testEmail,
        password: testPassword,
        roomNumber: "C-101",
        phone: "9988776655"
    });
    console.log(` Status: ${regRes.status}`, regRes.data);

    // 3. Login Student
    console.log("\n[TEST 3] Logging in test student");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
        email: testEmail,
        password: testPassword
    });
    const studentToken = loginRes.data.token;
    console.log(` Status: ${loginRes.status}, Token received: ${studentToken ? "YES" : "NO"}`);

    // 4. Role-Based Access Control: Student attempting restricted DELETE (Q2.b)
    console.log("\n[TEST 4] Student attempting restricted DELETE (Expected: 403 Forbidden)");
    const rbacDeleteRes = await makeRequest("DELETE", "/api/complaints/6614a8b2f1234567890abcde", null, studentToken);
    console.log(` Status: ${rbacDeleteRes.status}`);
    console.log(` Response:`, rbacDeleteRes.data);

    // 5. Role-Based Access Control: Student attempting restricted PUT (Q2.b)
    console.log("\n[TEST 5] Student attempting restricted PUT (Expected: 403 Forbidden)");
    const rbacPutRes = await makeRequest("PUT", "/api/complaints/6614a8b2f1234567890abcde", { status: "Resolved" }, studentToken);
    console.log(` Status: ${rbacPutRes.status}`);
    console.log(` Response:`, rbacPutRes.data);

    // 6. Setup TOTP MFA (Q2.b)
    console.log("\n[TEST 6] Setting up TOTP MFA for student");
    const mfaSetupRes = await makeRequest("POST", "/api/auth/mfa/setup", {}, studentToken);
    console.log(` Status: ${mfaSetupRes.status}`);
    console.log(` Secret Key Generated: ${mfaSetupRes.data.secret}`);
    console.log(` QR Code Generated    : ${mfaSetupRes.data.qrCode ? mfaSetupRes.data.qrCode.substring(0, 40) + "..." : "NONE"}`);

    const secret = mfaSetupRes.data.secret;
    const currentTotpCode = generateSync({ secret });
    console.log(` Simulated TOTP Authenticator code: ${currentTotpCode}`);

    // 7. Verify & Activate MFA
    console.log("\n[TEST 7] Verifying and activating MFA");
    const mfaVerifyRes = await makeRequest("POST", "/api/auth/mfa/verify", { totpCode: currentTotpCode }, studentToken);
    console.log(` Status: ${mfaVerifyRes.status}`, mfaVerifyRes.data);

    // 8. Login with MFA Challenge
    console.log("\n[TEST 8] Logging in with MFA active - Step 1: Credentials only (Expected: mfaRequired)");
    const mfaLoginPromptRes = await makeRequest("POST", "/api/auth/login", {
        email: testEmail,
        password: testPassword
    });
    console.log(` Status: ${mfaLoginPromptRes.status}`, mfaLoginPromptRes.data);

    console.log("\n[TEST 9] Logging in with MFA active - Step 2: Providing Invalid TOTP code");
    const invalidTotpRes = await makeRequest("POST", "/api/auth/login", {
        email: testEmail,
        password: testPassword,
        totpCode: "000000"
    });
    console.log(` Status: ${invalidTotpRes.status}`, invalidTotpRes.data);

    console.log("\n[TEST 10] Logging in with MFA active - Step 3: Providing Valid TOTP code");
    const newTotp = generateSync({ secret });
    const validTotpRes = await makeRequest("POST", "/api/auth/login", {
        email: testEmail,
        password: testPassword,
        totpCode: newTotp
    });
    console.log(` Status: ${validTotpRes.status}, Full Token Received: ${validTotpRes.data.token ? "YES" : "NO"}`);
    console.log("==========================================================\n");
}

module.exports = { runSecurityTests };

if (require.main === module) {
    runSecurityTests().catch(console.error);
}
