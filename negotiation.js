const CHAT_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";
const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";

const negotiationInput = {
  customer_summary: "LYZR is procuring 500 laptops (Intel i5, 16GB RAM, 512GB storage) for software development to be delivered by 20-Dec-2026. To validate your bid, please provide certified copies and validity dates for the mandatory certificates listed above (ISO 9001, ISO 27001, CE, FCC, IEC 62368-1, IEC 62133, RoHS, UN38.3, WEEE, UL). For each certificate include certificate number, issuing body, scope/models covered, and expiration date. Also attach supporting test reports/declarations for IEC 62368-1 and IEC 62133 (battery safety), UN38.3 (battery transport tests), CE/FCC Declarations of Conformity, RoHS test reports, and WEEE registration proof. Optionally include any good-to-have credentials from the list to enhance credibility. Finally, confirm whether the stated budget ($5000) is per unit or the total budget.",
    vendor_message: `We appreciate the clarity and the opportunity for a long-term partnership.

After final internal review, we are prepared to accept $4,000 per unit for the 500-unit PO under the conditions outlined, including payment terms, documentation timeline, pilot credit, delivery schedule, added services, 4-year warranty, and price validity.

We will issue the revised commercial proposal and full cost breakdown within 48 hours so you may proceed with PO issuance.`};

async function callNegotiationAgent() {
  try {
    const payload = {
      user_id: "sriram@lyzr.ai",
      agent_id: "6992e3c032a75e26d972bc90",
      session_id: "THREAD-1771205239329-fe2f02b4",
      message: JSON.stringify(negotiationInput) // MUST be string
    };

    console.log("🚀 Sending negotiation request...");
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

    console.log("✅ Negotiation Agent Response:");
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error("❌ Network Error:", error);
  }
}

callNegotiationAgent();