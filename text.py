import requests
import json

CHAT_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/"
API_KEY = "sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35"

# ---------------------
# RFQ Input
# ---------------------
rfq_input = {
    "from": "rfq_input_generator",
    "rfq_id": "RFQ-LYZR-2026-001",
    "organization_name": "LYZR",
    "contact_person": {
        "name": "Sriram",
        "email": "sriram@lyz.AI"
    },
    "procurement_type": "Services",
    "requirement_summary": "Cloud storage services (AWS S3 or GCP compatible)",
    "quantity": "50 TB",
    "delivery_timeline": "December 2026",
    "budget_range": "$10,000",
    "response_deadline": "2026-11-01",
    "additional_fields": [
        {
            "field_name": "Preferred Providers",
            "field_value": "AWS S3, GCP",
            "field_type": "text"
        },
        {
            "field_name": "Access Control",
            "field_value": "Restricted to organization members only",
            "field_type": "text"
        },
        {
            "field_name": "Required Certifications",
            "field_value": "ISO, HIPAA, and other cloud service related certifications",
            "field_type": "text"
        },
        {
            "field_name": "Security Requirements",
            "field_value": "Comprehensive security terms must be provided",
            "field_type": "text"
        },
        {
            "field_name": "Contact Role",
            "field_value": "Bidding details and contract finalization",
            "field_type": "text"
        }
    ]
}

# Convert to string
message_string = json.dumps(rfq_input)

# ---------------------
# Payload
# ---------------------
payload = {
    "user_id": "sriram@lyzr.ai",
    "agent_id": "6989a39654cd9f2a021d4947",
    "session_id": "6989a39654cd9f2a021d4947-ndrm9k5zmmn",
    "message": message_string
}

# ---------------------
# API Call
# ---------------------
try:
    print("🚀 Sending RFQ data to LYZR agent...")
    print("Payload:", json.dumps(payload, indent=2))

    response = requests.post(
        CHAT_API_URL,
        headers={
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        },
        json=payload
    )

    if response.status_code != 200:
        print("❌ API Error:", response.status_code)
        print(response.text)
    else:
        print("✅ Agent Response:")
        print(json.dumps(response.json(), indent=2))

except Exception as e:
    print("❌ Network Error:", str(e))