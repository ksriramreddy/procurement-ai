// import axios from "axios";
// import fs from "fs";
// import FormData from "form-data";
// import { Certificate } from "crypto";

// // ===================== CONFIG =====================
// const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";
// const AGENT_ID = "698489e84dccb4f84060e5cd";
// const FILE_PATH = "iso27001.jpg";
// const USER_ID = "sriram@lyzr.ai";
// const SESSION_ID = "698468a43107974e70311aaf-xr4qyuudi2oi";

// // Lyzr endpoints
// const ASSET_UPLOAD_URL = "https://agent-prod.studio.lyzr.ai/v3/assets/upload";
// const CHAT_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
// // ==================================================

// async function uploadAsset() {
//   console.log("⬆️ Uploading asset...");

//   const formData = new FormData();
//   formData.append("files", fs.createReadStream(FILE_PATH));

//   const response = await axios.post(
//     ASSET_UPLOAD_URL,
//     formData,
//     {
//       headers: {
//         "x-api-key": API_KEY,
//         ...formData.getHeaders()
//       }
//     }
//   );

//   console.log("✅ Upload response:", JSON.stringify(response.data, null, 2));

//   // ✅ CORRECT asset_id extraction
//   const result = response.data.results?.[0];

//   if (!result || !result.success || !result.asset_id) {
//     throw new Error(
//       `Asset upload failed: ${result?.error || "Unknown error"}`
//     );
//   }

//   const assetId = result.asset_id;
//   console.log("🆔 Asset ID:", assetId);

//   return assetId;
// }

// async function chatWithAgent(assetId) {
//   console.log("🤖 Sending message to agent...");

//   const payload = {
//     user_id: USER_ID,
//     agent_id: AGENT_ID,
//     session_id: SESSION_ID,
//     message: JSON.stringify({
//       certificate: "ISO/IEC 27001"
//     }),
//     assets: [assetId],
//     internal_call: false,
//     simulation_mode: false
//   };

//   console.log("➡️ Chat payload:", JSON.stringify(payload, null, 2));

//   const response = await axios.post(
//     CHAT_API_URL,
//     payload,
//     {
//       headers: {
//         "x-api-key": API_KEY,
//         "Content-Type": "application/json"
//       }
//     }
//   );

//   console.log("🤖 Agent response:");
//   console.log(JSON.stringify(response.data, null, 2));
// }

// async function main() {
//   try {
//     const assetId = await uploadAsset();
//     await chatWithAgent(assetId);
//   } catch (error) {
//     console.error("❌ Error occurred");

//     if (error.response) {
//       console.error("Status:", error.response.status);
//       console.error("Data:", JSON.stringify(error.response.data, null, 2));
//     } else {
//       console.error(error.message);
//     }
//   }
// }

// main();


const CHAT_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";

const validatorInput = {
  user_message: {
    value: "verify the give certificate valid or not"
  },
  agent_ocr_for_ve: {
    certificate_name: "ISO/IEC 27001",
    extracted_text: `Certificate of Registration

This is to Certify that
Information Security Management System of

TELEYSIA NETWORKS PVT. LTD.

"SYNTHESIS-THE FIRST", BLOCK- A ,603 to 606,THE FIRST AVENUE ROAD,
BEHIND KESHAVBAUG PARTY PLOT,OFF 132 FEET RING ROAD,
VASTRAPUR, AHMEDABAD-380015 GUJARAT, INDIA.

has been assessed and found to conform to the requirements of
ISO/IEC 27001:2013

For the following scope :

TELECOM IMPLEMENTATION, MANAGED SERVICES AND RF ( RADIO
FREQUENCY) OPTIMIZATION - MEASUREMENT SERVICES, TELECOM
INFRASTRUCTURE, TELECOMMUNICATION RENTAL EQUIPMENTS &
RELATED TRAININGS, SOLAR EQUIPMENT INSTALLATION
(TESTING,OPERATIONS AND MAINTENANCE)

Certificate No  : 19IIEH05
Initial Registration Date : 28/11/2019
Issuance Date : 28/11/2019
Date of Expiry : 27/11/2022`,
    ocr_quality_score: 98.5
  }
};

async function callValidatorAgent() {
  try {
    const payload = {
      user_id: "sriram@lyzr.ai",
      agent_id: "6989b60a434150f821000b98",
      session_id: "6989b60a434150f821000b98-px7dgjqpxzs",
      message: JSON.stringify(validatorInput) // 🔥 MUST be string
    };

    console.log("🚀 Sending request to validator agent...");
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:", data);
      return;
    }

    console.log("✅ Validator Agent Response:");
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error("❌ Network Error:", error);
  }
}

callValidatorAgent();