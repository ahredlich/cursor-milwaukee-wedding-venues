import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = process.env.PORT || 3000;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end("Method Not Allowed");
    return;
  }

  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
    return;
  }

  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, rel);

  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain" }).end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    const sendIndex = (status) => {
      const fallback = path.join(ROOT, "index.html");
      fs.readFile(fallback, (e, buf) => {
        if (e) {
          res.writeHead(404, { "Content-Type": "text/plain" }).end("Not Found");
          return;
        }
        res.writeHead(status, {
          "Content-Type": TYPES[".html"],
          "Cache-Control": "no-cache",
        });
        res.end(req.method === "HEAD" ? undefined : buf);
      });
    };

    if (err || !stat.isFile()) {
      sendIndex(200);
      return;
    }

    const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const headers = {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Cache-Control": type.startsWith("text/html")
        ? "public, max-age=0, must-revalidate"
        : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    };

    if (req.method === "HEAD") {
      res.writeHead(200, headers).end();
      return;
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`cursor-milwaukee-wedding-venues listening on :${PORT}`);
});
