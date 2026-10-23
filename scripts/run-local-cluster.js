const http = require("http");
const { fork } = require("child_process");
const path = require("path");

const instances = [
    { id: "HostelFix-Backend-1", port: 5001, process: null, healthy: true },
    { id: "HostelFix-Backend-2", port: 5002, process: null, healthy: true },
    { id: "HostelFix-Backend-3", port: 5003, process: null, healthy: true }
];

let roundRobinIndex = 0;
let failoverConfigured = true; // Toggle for Question 1c demonstration

function startInstance(index) {
    const inst = instances[index];
    if (inst.process) return;

    console.log(`[CLUSTER] Starting ${inst.id} on port ${inst.port}...`);
    inst.process = fork(path.join(__dirname, "../server/server.js"), [], {
        env: {
            ...process.env,
            PORT: inst.port,
            INSTANCE_ID: inst.id
        },
        stdio: ["ignore", "pipe", "pipe", "ipc"]
    });

    inst.healthy = true;

    inst.process.stdout.on("data", (data) => {
        // Suppress repetitive logs
    });

    inst.process.stderr.on("data", (data) => {
        // Output errors if any
    });

    inst.process.on("exit", (code) => {
        console.log(`[CLUSTER] ⚠️  ${inst.id} STOPPED (code: ${code})`);
        inst.process = null;
        inst.healthy = false;
    });
}

function stopInstance(index) {
    const inst = instances[index];
    if (!inst.process) {
        console.log(`[CLUSTER] ${inst.id} is already stopped.`);
        return;
    }
    console.log(`[CLUSTER] 🛑 Stopping ${inst.id}...`);
    inst.healthy = false;
    inst.process.kill();
    inst.process = null;
}

// Start all 3 instances
instances.forEach((_, idx) => startInstance(idx));

// Reverse Proxy & Load Balancer on Port 8080 (simulating Nginx)
const proxyServer = http.createServer((clientReq, clientRes) => {
    // Select backend via Round Robin
    const attempts = failoverConfigured ? instances.length : 1;
    let attemptCount = 0;

    function tryForward(instIdx) {
        attemptCount++;
        const target = instances[instIdx];

        const options = {
            hostname: "localhost",
            port: target.port,
            path: clientReq.url,
            method: clientReq.method,
            headers: {
                ...clientReq.headers,
                "x-forwarded-for": clientReq.socket.remoteAddress,
                "x-forwarded-host": clientReq.headers.host
            },
            timeout: 2000
        };

        const proxyReq = http.request(options, (targetRes) => {
            clientRes.writeHead(targetRes.statusCode, {
                ...targetRes.headers,
                "x-served-by-proxy": "HostelFix-Local-LB",
                "x-upstream-node": target.id
            });
            targetRes.pipe(clientRes);
        });

        proxyReq.on("error", (err) => {
            // If failover is enabled and attempts remain, try next healthy node
            if (failoverConfigured && attemptCount < attempts) {
                const nextIdx = (instIdx + 1) % instances.length;
                tryForward(nextIdx);
            } else {
                clientRes.writeHead(502, { "Content-Type": "application/json" });
                clientRes.end(JSON.stringify({
                    error: "502 Bad Gateway",
                    message: "Upstream instance connection failed (No failover retry or all nodes dead)",
                    failedNode: target.id
                }));
            }
        });

        proxyReq.on("timeout", () => {
            proxyReq.destroy();
            if (failoverConfigured && attemptCount < attempts) {
                const nextIdx = (instIdx + 1) % instances.length;
                tryForward(nextIdx);
            } else {
                clientRes.writeHead(504, { "Content-Type": "application/json" });
                clientRes.end(JSON.stringify({ error: "504 Gateway Timeout" }));
            }
        });

        clientReq.pipe(proxyReq);
    }

    const selectedIdx = roundRobinIndex % instances.length;
    roundRobinIndex++;
    tryForward(selectedIdx);
});

proxyServer.listen(8080, () => {
    console.log("==========================================================");
    console.log(" HOSTELFIX LOCAL 3-INSTANCE CLUSTER & LOAD BALANCER");
    console.log("==========================================================");
    console.log(" Load Balancer (Proxy) : http://localhost:8080");
    console.log(" Instance 1            : http://localhost:5001");
    console.log(" Instance 2            : http://localhost:5002");
    console.log(" Instance 3            : http://localhost:5003");
    console.log(" Zero-Downtime Failover: ENABLED (proxy_next_upstream active)");
    console.log("----------------------------------------------------------");
    console.log(" Controls:");
    console.log("   Type 'stop 2'   -> Kills Instance 2 mid-flight");
    console.log("   Type 'start 2'  -> Restarts Instance 2");
    console.log("   Type 'failover' -> Toggles Failover ON/OFF");
    console.log("   Type 'exit'     -> Shuts down entire cluster");
    console.log("==========================================================\n");
});

// Interactive terminal commands
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === "stop 1") stopInstance(0);
    else if (cmd === "stop 2") stopInstance(1);
    else if (cmd === "stop 3") stopInstance(2);
    else if (cmd === "start 1") startInstance(0);
    else if (cmd === "start 2") startInstance(1);
    else if (cmd === "start 3") startInstance(2);
    else if (cmd === "failover") {
        failoverConfigured = !failoverConfigured;
        console.log(`[CLUSTER] Failover retry mechanism is now: ${failoverConfigured ? "ENABLED" : "DISABLED"}`);
    } else if (cmd === "exit") {
        console.log("[CLUSTER] Shutting down cluster...");
        instances.forEach((_, idx) => stopInstance(idx));
        proxyServer.close();
        process.exit(0);
    }
});

process.on("SIGINT", () => {
    instances.forEach((_, idx) => stopInstance(idx));
    proxyServer.close();
    process.exit(0);
});
