const http = require("http");

const TARGET_URL = process.argv[2] || "http://localhost:8080/api/health";
const DURATION_SECONDS = parseInt(process.argv[3], 10) || 12;

console.log("==========================================================");
console.log(` HOSTELFIX FAILOVER BENCHMARK (Assignment 3 - Question 1c)`);
console.log("==========================================================");
console.log(` Target URL       : ${TARGET_URL}`);
console.log(` Test Duration    : ${DURATION_SECONDS} seconds`);
console.log(" Instructions     : While this script runs, stop one backend container");
console.log("                    (e.g., 'docker stop hostelfix-backend-2')");
console.log("----------------------------------------------------------");

let totalSent = 0;
let successCount = 0;
let failedCount = 0;
const statusCodes = {};
const instanceResponses = {};

const urlObj = new URL(TARGET_URL);
let isRunning = true;

function sendOne() {
    if (!isRunning) return;
    totalSent++;

    const req = http.get(
        {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname,
            timeout: 2500
        },
        (res) => {
            statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;
            const inst = res.headers["x-backend-instance"] || "unknown";
            instanceResponses[inst] = (instanceResponses[inst] || 0) + 1;

            if (res.statusCode >= 200 && res.statusCode < 400) {
                successCount++;
                process.stdout.write(".");
            } else {
                failedCount++;
                process.stdout.write("x");
            }
            res.resume();
        }
    );

    req.on("error", (err) => {
        failedCount++;
        statusCodes[err.code || "ERR"] = (statusCodes[err.code || "ERR"] || 0) + 1;
        process.stdout.write("E");
    });

    req.on("timeout", () => {
        req.destroy();
        failedCount++;
        statusCodes["TIMEOUT"] = (statusCodes["TIMEOUT"] || 0) + 1;
        process.stdout.write("T");
    });
}

// Send 25 requests every second
const interval = setInterval(() => {
    for (let i = 0; i < 20; i++) {
        sendOne();
    }
}, 50);

setTimeout(() => {
    isRunning = false;
    clearInterval(interval);

    setTimeout(() => {
        console.log("\n\n--- FAILOVER TEST SUMMARY ---");
        console.log(` Total Requests Dispatched: ${totalSent}`);
        console.log(` Successful (HTTP 2xx)    : ${successCount}`);
        console.log(` Failed Requests          : ${failedCount}`);
        console.log("\n Status Code Breakdown:");
        Object.entries(statusCodes).forEach(([code, count]) => {
            console.log(`   ${code}: ${count}`);
        });

        console.log("\n Responses by Backend Node:");
        Object.entries(instanceResponses).forEach(([node, count]) => {
            console.log(`   ${node}: ${count}`);
        });
        console.log("==========================================================\n");
    }, 1000);
}, DURATION_SECONDS * 1000);
