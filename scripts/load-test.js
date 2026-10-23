const http = require("http");

// Configuration
const TARGET_URL = process.argv[2] || "http://localhost:8080/api/health";
const TOTAL_REQUESTS = parseInt(process.argv[3], 10) || 1000;
const CONCURRENCY = parseInt(process.argv[4], 10) || 50;

console.log("==========================================================");
console.log(` HOSTELFIX LOAD TESTING SUITE (Assignment 3 - Question 1b)`);
console.log("==========================================================");
console.log(` Target URL       : ${TARGET_URL}`);
console.log(` Total Requests   : ${TOTAL_REQUESTS}`);
console.log(` Concurrency Level: ${CONCURRENCY}`);
console.log("----------------------------------------------------------");

const urlObj = new URL(TARGET_URL);
let completed = 0;
let successful = 0;
let failed = 0;
const latencies = [];
const instanceCounts = {};

const startTime = process.hrtime();

function sendRequest() {
    return new Promise((resolve) => {
        const reqStartTime = Date.now();
        const req = http.get(
            {
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: urlObj.pathname + urlObj.search,
                headers: { "User-Agent": "HostelFix-LoadTester/1.0" },
                timeout: 5000
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => { data += chunk; });
                res.on("end", () => {
                    const latency = Date.now() - reqStartTime;
                    latencies.push(latency);

                    const instance = res.headers["x-backend-instance"] || "unknown";
                    instanceCounts[instance] = (instanceCounts[instance] || 0) + 1;

                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        successful++;
                    } else {
                        failed++;
                    }
                    completed++;
                    resolve();
                });
            }
        );

        req.on("error", (err) => {
            failed++;
            completed++;
            resolve();
        });

        req.on("timeout", () => {
            req.destroy();
            failed++;
            completed++;
            resolve();
        });
    });
}

async function runLoadTest() {
    let activeWorkers = 0;
    let requestIndex = 0;

    return new Promise((resolve) => {
        function next() {
            while (activeWorkers < CONCURRENCY && requestIndex < TOTAL_REQUESTS) {
                activeWorkers++;
                requestIndex++;
                sendRequest().then(() => {
                    activeWorkers--;
                    if (completed >= TOTAL_REQUESTS) {
                        resolve();
                    } else {
                        next();
                    }
                });
            }
        }
        next();
    });
}

runLoadTest().then(() => {
    const elapsed = process.hrtime(startTime);
    const totalTimeSec = elapsed[0] + elapsed[1] / 1e9;
    const rps = (successful / totalTimeSec).toFixed(2);
    const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

    console.log("\n--- LOAD TEST RESULTS ---");
    console.log(` Total Time Elapsed   : ${totalTimeSec.toFixed(3)} seconds`);
    console.log(` Successful Requests  : ${successful} / ${TOTAL_REQUESTS}`);
    console.log(` Failed Requests      : ${failed}`);
    console.log(` Requests Per Second  : ${rps} req/sec`);
    console.log(` Average Response Time: ${avgLatency} ms`);
    console.log(` 95th Percentile (P95): ${p95} ms`);
    console.log(` 99th Percentile (P99): ${p99} ms`);

    console.log("\n--- REQUEST DISTRIBUTION ACROSS INSTANCES ---");
    Object.entries(instanceCounts).forEach(([inst, count]) => {
        const pct = ((count / TOTAL_REQUESTS) * 100).toFixed(1);
        console.log(`  ${inst.padEnd(25)} : ${count} requests (${pct}%)`);
    });
    console.log("==========================================================\n");
});
