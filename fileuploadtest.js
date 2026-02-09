import axios from "axios";
import fs from "fs";
import FormData from "form-data";

// ===================== CONFIG =====================
const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";
const AGENT_ID = "698468a43107974e70311aaf";
const FILE_PATH = "./fileuploadtest.pdf";
const USER_ID = "sriram@lyzr.ai";
const SESSION_ID = "698468a43107974e70311aaf-xr4qidi2oi";

// Lyzr endpoints
const ASSET_UPLOAD_URL = "https://agent-prod.studio.lyzr.ai/v3/assets/upload";
const CHAT_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
// ==================================================

async function uploadAsset() {
  console.log("⬆️ Uploading asset...");

  const formData = new FormData();
  formData.append("files", fs.createReadStream(FILE_PATH));

  const response = await axios.post(
    ASSET_UPLOAD_URL,
    formData,
    {
      headers: {
        "x-api-key": API_KEY,
        ...formData.getHeaders()
      }
    }
  );

  console.log("✅ Upload response:", JSON.stringify(response.data, null, 2));

  // ✅ CORRECT asset_id extraction
  const result = response.data.results?.[0];

  if (!result || !result.success || !result.asset_id) {
    throw new Error(
      `Asset upload failed: ${result?.error || "Unknown error"}`
    );
  }

  const assetId = result.asset_id;
  console.log("🆔 Asset ID:", assetId);

  return assetId;
}

async function chatWithAgent(assetId) {
  console.log("🤖 Sending message to agent...");

  const payload = {
    user_id: USER_ID,
    agent_id: AGENT_ID,
    session_id: SESSION_ID,
    message: "Please read the uploaded file and give me a summary.",
    assets: [assetId],
    internal_call: false,
    simulation_mode: false
  };

  console.log("➡️ Chat payload:", JSON.stringify(payload, null, 2));

  const response = await axios.post(
    CHAT_API_URL,
    payload,
    {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  console.log("🤖 Agent response:");
  console.log(JSON.stringify(response.data, null, 2));
}

async function main() {
  try {
    const assetId = await uploadAsset();
    await chatWithAgent(assetId);
  } catch (error) {
    console.error("❌ Error occurred");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

main();