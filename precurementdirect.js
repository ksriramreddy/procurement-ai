/**
 * LYZR Chat API + Metrics WebSocket
 * --------------------------------
 * - Calls Manager Agent
 * - Listens to Metrics WebSocket
 * - Extracts tool_output
 * - Converts Python-style strings → clean JSON
 * - Outputs frontend-ready JSON
 */

import WebSocket from "ws";

// ===============================
// CONFIG
// ===============================
const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";
const USER_ID = "sriram@lyzr.ai";
const AGENT_ID = "698468a43107974e70311aaf";
const SESSION_ID = `${AGENT_ID}-CHAT-${Date.now()}`;

const CHAT_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const METRICS_WS_URL = `wss://metrics.studio.lyzr.ai/ws/${SESSION_ID}?x-api-key=${API_KEY}`;

// ===============================
// TOOL OUTPUT → CLEAN JSON
// ===============================
function extractCleanJSONFromToolOutput(toolOutputRaw) {
  try {
    // Normalize Python-style dict → JSON-compatible
    let normalized = toolOutputRaw
      .replace(/'/g, '"')
      .replace(/\bFalse\b/g, "false")
      .replace(/\bTrue\b/g, "true");

    // Parse outer wrapper
    const outer = JSON.parse(normalized);

    if (!outer.response || typeof outer.response !== "string") {
      throw new Error("No JSON response field found");
    }

    let inner = outer.response;

    // Fix unescaped quotes inside text
    inner = inner.replace(/(\w)"(\w)/g, '$1\\"$2');

    return JSON.parse(inner);

  } catch (err) {
    console.error("❌ Failed parsing tool_output →", err.message);
    console.error("🔎 Raw tool_output:", toolOutputRaw);
    return null;
  }
}

// ===============================
// METRICS WEBSOCKET
// ===============================
function openMetricsWebSocket() {
  const ws = new WebSocket(METRICS_WS_URL);

  console.log("\n==============================================");
  console.log("📡 METRICS WEBSOCKET CONNECTING");
  console.log("SESSION_ID:", SESSION_ID);
  console.log("==============================================\n");

  ws.on("open", () => {
    console.log("✅ METRICS WS CONNECTED\n");
  });

  ws.on("message", (data) => {
    let event;

    try {
      event = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (
      event.event_type === "tool_output" &&
      event.status === "success" &&
      event.tool_output
    ) {
      const cleanJSON = extractCleanJSONFromToolOutput(event.tool_output);

      if (cleanJSON) {
        console.log("✅ FINAL CLEAN JSON (FRONTEND READY)");
        console.log("----------------------------------------------");
        console.log(JSON.stringify(cleanJSON, null, 2));
        console.log("----------------------------------------------\n");
      }
    }
  });

  ws.on("close", (code, reason) => {
    console.log("🔌 METRICS WS CLOSED:", code, reason.toString());
  });

  ws.on("error", (err) => {
    console.error("❌ METRICS WS ERROR:", err);
  });
}

// ===============================
// CHAT API CALL
// ===============================
async function callChatAgent() {
  const messagePayload = {
    action: "execute",
    request_id: SESSION_ID,
    message:
      "Our organisation name is LZR. Contact person is Sriram (sriram.i.a.in@example.com). We need 500 laptops for software development. Budget is 50 million."
  };

  console.log("🚀 CALLING CHAT API\n");

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({
      user_id: USER_ID,
      agent_id: AGENT_ID,
      session_id: SESSION_ID,
      message: JSON.stringify(messagePayload)
    })
  });

  const data = await res.json();

  console.log("📥 CHAT API ACK RECEIVED\n");
  return data;
}

// ===============================
// MAIN
// ===============================
async function main() {
  console.log("\n================= START =================\n");

  // Start WebSocket first
  openMetricsWebSocket();

  // Allow WS to subscribe
  await new Promise((r) => setTimeout(r, 300));

  // Trigger agent
  await callChatAgent();
}

main().catch((err) => {
  console.error("❌ FATAL ERROR:", err);
});