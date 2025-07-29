#!/usr/bin/env node

import http from "http";
import httpProxy from "http-proxy";

const PROXY_PORT = parseInt(process.env.DEV_PROXY_PORT || "8080", 10);
const SIGNALR_PATH = "/WS/";
const API_PATH = "/API/";

// Create the proxy server (for both HTTP and WS)
const proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: true });

proxy.on("error", (err, req, res) => {
  console.error("▶ Proxy error:", err);
  if (!res.headersSent) {
    res.writeHead(502, { "Content-Type": "text/plain" });
  }
  res.end("Bad gateway.");
});

const server = http.createServer((req, res) => {
  const url = req.url || "";
  if (url.startsWith(SIGNALR_PATH) || url.startsWith(API_PATH)) {
    proxy.web(req, res, { target: "http://localhost:5219" });
  } else {
    proxy.web(req, res, { target: "http://localhost:3000" });
  }
});

server.on("upgrade", (req, socket, head) => {
  const url = req.url || "";
  if (url.startsWith(SIGNALR_PATH)) {
    proxy.ws(req, socket, head, { target: "http://localhost:5219" });
  } else {
    socket.destroy();
  }
});

server.listen(PROXY_PORT, () => {
  console.log(`▶ dev-proxy listening on http://localhost:${PROXY_PORT}`);
});
