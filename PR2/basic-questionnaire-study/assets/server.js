/**
 * server.js
 * ─────────────────────────────────────────────
 * Lightweight Node.js server (zero dependencies).
 *  • Serves static files from the project root.
 *  • POST /api/log  → appends a trial result row to results.csv.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8080;
const CSV_FILE = path.join(__dirname, "results.csv");
const HEADER = "trialId,timestamp,startX,startY,endX,endY,speed,height,ballColor,courtColor,guessX,guessY,errorFt";

// ── MIME types for static files ──
const MIME = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
    // ── API: get the next available trial ID ──
    if (req.method === "GET" && req.url === "/api/next-id") {
        let nextId = 1;
        if (fs.existsSync(CSV_FILE)) {
            const content = fs.readFileSync(CSV_FILE, "utf-8").trim();
            const lines = content.split("\n").filter((l) => l.length > 0);
            // Subtract 1 for the header row
            nextId = Math.max(1, lines.length);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ nextId }));
        return;
    }

    // ── API: append a trial result ──
    if (req.method === "POST" && req.url === "/api/log") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            try {
                const r = JSON.parse(body);
                const row = [
                    r.trialId, r.timestamp, r.startX, r.startY, r.endX, r.endY,
                    r.speed, r.height, r.ballColor, r.courtColor,
                    r.guessX, r.guessY, r.errorFt,
                ].join(",");

                // Ensure header exists (handles mid-run file deletion)
                if (!fs.existsSync(CSV_FILE)) {
                    fs.writeFileSync(CSV_FILE, HEADER + "\n", "utf-8");
                }

                fs.appendFileSync(CSV_FILE, row + "\n", "utf-8");
                console.log(`  ✓ Logged trial ${r.trialId}`);

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true }));
            } catch (err) {
                console.error("Log error:", err);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // ── Static file serving ──
    let filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not found");
            return;
        }
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n  🏓 Pickleball experiment server running at:`);
    console.log(`     http://localhost:${PORT}/\n`);
    console.log(`  Results will be saved to: ${CSV_FILE}\n`);
});
