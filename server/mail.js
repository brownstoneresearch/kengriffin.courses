#!/usr/bin/env node
/**
 * Local mail + static server.
 * Git Bash / terminal:
 *   node server/mail.js
 */
const { createServer } = require("node:http");
const { readFileSync, existsSync } = require("node:fs");
const { extname, join, normalize } = require("node:path");

const root = join(__dirname, "..");
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const KEY = process.env.RESEND_API_KEY || "re_HtWXnSnA_LN2StbiTEg5SEhYGAAaddrA5";
const FROM = process.env.RESEND_FROM || "Ken Cordele Griffin Academy <admissions@kengriffin.courses>";
const PORTAL = process.env.PORTAL_URL || "https://kengriffin.courses/login.html";
const PORT = Number(process.env.PORT || 8787);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".md": "text/plain; charset=utf-8"
};

async function sendInvite({ name, email, password, track }) {
  if (!String(KEY).startsWith("re_")) throw new Error("Resend API key missing");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "Your Ken Cordele Griffin Academy portal profile",
      text: [
        "Hello " + (name || "") + ",",
        "",
        "An administrator issued your academy portal profile.",
        "Track: " + (track || "Foundations of the Market"),
        "Sign in: " + PORTAL,
        "Email: " + email,
        "Temporary password: " + password,
        "",
        "Independent educational brand. Not affiliated with Citadel LLC or Citadel Securities."
      ].join("\n")
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Resend refused the send");
  return data;
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "POST" && req.url === "/api/send-invite") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const data = await sendInvite(JSON.parse(body || "{}"));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, id: data.id }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
    }
    return;
  }

  if (req.method === "GET" && req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, resend: String(KEY).startsWith("re_") }));
    return;
  }

  if (req.method === "GET") {
    let path = req.url.split("?")[0];
    if (path === "/") path = "/index.html";
    const file = normalize(join(root, path.replace(/^\/+/, "")));
    if (!file.startsWith(root) || !existsSync(file)) {
      res.writeHead(404); res.end("not found"); return;
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
    return;
  }
  res.writeHead(405); res.end("method");
});

server.listen(PORT, () => {
  console.log("KCGA mail server http://127.0.0.1:" + PORT);
  console.log("Resend key loaded:", String(KEY).startsWith("re_"));
});
