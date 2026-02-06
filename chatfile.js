// import { log } from "console";
// import fs from "fs";

// const API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
// const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";

// const payload = {
//   user_id: "sriram@lyzr.ai",
//   agent_id: "698311d86738a8c0ed88d471",
//   session_id: "698311d86738a8c0ed88d471-y2vnziosame",
//   message: JSON.stringify({
// "from": "rfq_input_generator",
// "rfq_id": "LYZE-123-456",
// "organization_name": "LZR",
// "contact_person": {
// "name": "Sriram",
// "email": "sriram.i.a.in@example"
// },
// "procurement_type": "goods",
// "requirement_summary": "I need 500 laptops for our soft development",
// "quantity": "500",
// "delivery_timeline": "",
// "budget_range": "50 million",
// "response_deadline": 	"2026-02-05T00:00:00Z"
// }
// )
// };

// async function callAgentAndSaveFile() {
//   const res = await fetch(API_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "x-api-key": API_KEY
//     },
//     body: JSON.stringify(payload)
//   });
//   console.log(res);
  

//   const data = await res.json();

//   fs.writeFileSync(
//     "agent_output.json",
//     JSON.stringify(data, null, 2),
//     "utf-8"
//   );

//   console.log("✅ Agent response saved to agent_output.json");

//   if (!res.ok) {
//     console.error("❌ API returned error:", data);
//   }
// }

// callAgentAndSaveFile().catch(console.error);




// import WebSocket from "ws";
// import fs from "fs";

// // ===============================
// // CONFIG
// // ===============================
// const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";
// const AGENT_ID = "698468a43107974e70311aaf";
// const USER_ID = "sriram@lyzr.ai";
// const SESSION_ID = `${AGENT_ID}-CHAT-${Date.now()}`;

// const CHAT_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
// const METRICS_WS_URL = `wss://metrics.studio.lyzr.ai/ws/${SESSION_ID}?x-api-key=${API_KEY}`;

// // ===============================
// // METRICS WEBSOCKET LISTENER
// // ===============================
// function startMetricsListener() {
//   const ws = new WebSocket(METRICS_WS_URL);

//   ws.on("open", () => {
//     console.log("✅ METRICS WS CONNECTED");
//   });

//   ws.on("message", (msg) => {
//     let event;
//     try {
//       event = JSON.parse(msg.toString());
//     } catch {
//       return;
//     }

//     // 🎯 ONLY handle get_artifact output
//     if (
//       event.event_type === "tool_output" &&
//       event.tool_name === "get_artifact" &&
//       event.status === "success"
//     ) {
//       try {
//         // tool_output is Python-style string → normalize
//         const normalized = event.tool_output
//           .replace(/'/g, '"')
//           .replace(/\bTrue\b/g, "true")
//           .replace(/\bFalse\b/g, "false");

//         const artifact = JSON.parse(normalized);

//         const fileName =
//           artifact.name ||
//           `artifact_${artifact.artifact_id || Date.now()}.json`;

//         const content =
//           typeof artifact.data === "string"
//             ? artifact.data
//             : JSON.stringify(artifact.data, null, 2);

//         fs.writeFileSync(fileName, content);

//         console.log("✅ ARTIFACT CONTENT RETRIEVED");
//         console.log("📄 Saved as:", fileName);
//       } catch (err) {
//         console.error("❌ Failed to parse artifact:", err.message);
//       }
//     }
//   });

//   ws.on("error", (err) => {
//     console.error("❌ WS ERROR:", err.message);
//   });
// }

// // ===============================
// // CHAT API CALL (TRIGGERS AGENT)
// // ===============================
// async function callAgent() {
//   await fetch(CHAT_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "x-api-key": API_KEY
//     },
//     body: JSON.stringify({
//       user_id: USER_ID,
//       agent_id: AGENT_ID,
//       session_id: SESSION_ID,
//       message: JSON.stringify({
//         action: "execute",
//         request_id: SESSION_ID
//       })
//     })
//   });
// }

// // ===============================
// // MAIN
// // ===============================
// async function main() {
//   startMetricsListener();
//   await new Promise((r) => setTimeout(r, 300));
//   await callAgent();
// }

// main();

const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";
const CHAT_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";

async function callPricingSuggestionAgent() {
  const payload = {
    user_id: "sriram@lyzr.ai",
    agent_id: "6985810b0ee88347863f06fa",
    session_id: "6985810b0ee88347863f06fa-demo-session",
    message: JSON.stringify({
      intent: "pricing_suggestion",
      procurement_details: {
        item: "laptops",
        quantity: 5,
        usage: "software development",
        specifications: {
          ram: "32 GB or higher",
          storage: "512 GB SSD or higher"
        },
        contract_duration: "5 years"
      }
    })
  };

  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log("Agent Response:");
  console.log(JSON.stringify(data, null, 2));
}

callPricingSuggestionAgent().catch(console.error);