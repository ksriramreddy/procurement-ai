const axios = require("axios");

const API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35";
const session_id = "THREAD-1771224399630-f8e37e9d";

const url = `https://agent-prod.studio.lyzr.ai/v1/sessions/${session_id}/history`;

const headers = {
  accept: "application/json",
  "x-api-key": API_KEY
};

axios
  .get(url, { headers })
  .then((response) => {
    console.log("✅ Session History:");
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch((error) => {
    if (error.response) {
      console.error(
        `❌ API Error: ${error.response.status}`,
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("❌ Network Error:", error.message);
    }
  });