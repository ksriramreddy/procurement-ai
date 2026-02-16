import uuid
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pymongo.errors import DuplicateKeyError
from ..database.connection import vendors_collection, email_threads_collection

router = APIRouter(prefix="/send-document", tags=["Send Document"])


class VendorPayload(BaseModel):
    vendor_id: str = ""          # website URL used as vendor_id
    vendor_name: str = ""
    contact_email: str = ""
    contact_name: str = ""
    vendor_type: str = ""
    headquarters: str = ""
    website: str = ""
    source: str = "internal"


class SendDocumentRequest(BaseModel):
    vendors: list[VendorPayload]
    document_type: str           # "RFQ" or "RFP"
    subject: str                 # requirement_summary for RFQ, project_title for RFP
    quoted_price: Optional[int] = None
    document_content: Optional[str] = None
    mandatory: list[str] = []          # mandatory certifications from cert agent
    good_to_have: list[str] = []       # good-to-have certifications from cert agent
    summary: str = ""                  # requirement summary from cert agent


class SendDocumentVendorResult(BaseModel):
    vendor_id: str
    vendor_name: str
    thread_id: str


class SendDocumentResponse(BaseModel):
    created_vendors: list[SendDocumentVendorResult]
    updated_vendors: list[SendDocumentVendorResult]


def generate_thread_id() -> str:
    ts = int(datetime.utcnow().timestamp() * 1000)
    short = uuid.uuid4().hex[:8]
    return f"THREAD-{ts}-{short}"


@router.put("/", response_model=SendDocumentResponse)
async def send_document(data: SendDocumentRequest):
    created = []
    updated = []

    print(f"[send_document] Received {len(data.vendors)} vendors, doc_type={data.document_type}")
    try:
        for v in data.vendors:
            print(f"[send_document] Processing vendor: {v.vendor_name} ({v.vendor_id})")
            # vendor_id = website URL (primary key for both internal & external)
            vendor_id = v.vendor_id  # frontend already maps website → vendor_id

            if not vendor_id:
                vendor_id = v.website or v.contact_email or v.vendor_name or "unknown"

            # 1. Create thread with certification data (convert strings to objects)
            thread_id = generate_thread_id()
            thread_doc = {
                "thread_id": thread_id,
                "vendor_id": vendor_id,
                "subject": data.subject,
                "document_type": data.document_type,
                "mandatory": [{"certificate": c, "is_submitted": ""} for c in data.mandatory],
                "good_to_have": [{"certificate": c, "is_submitted": ""} for c in data.good_to_have],
                "summary": data.summary,
                "created_at": datetime.utcnow(),
            }
            print(f"[send_document] Inserting thread {thread_id} for vendor {vendor_id}")
            await email_threads_collection.insert_one(thread_doc)
            print(f"[send_document] Thread inserted OK. Now upserting vendor...")

            # 2. Upsert vendor: try update first, create if not found
            result = await vendors_collection.update_one(
                {"vendor_id": vendor_id},
                {"$push": {"thread_ids": thread_id}},
            )

            if result.matched_count > 0:
                updated.append(SendDocumentVendorResult(
                    vendor_id=vendor_id,
                    vendor_name=v.vendor_name,
                    thread_id=thread_id,
                ))
            else:
                # Vendor doesn't exist - create it
                vendor_doc = {
                    "vendor_id": vendor_id,
                    "vendor_name": v.vendor_name,
                    "thread_ids": [thread_id],
                    "quoted_price": data.quoted_price,
                    "technical_compliance_status": False,
                    "certifications_submitted": [],
                    "esg_declaration": False,
                    "exceptions_noted": "",
                    "clarifications": [],
                    "response_date": datetime.utcnow(),
                    "vendor_type": v.vendor_type,
                    "contact_email": v.contact_email,
                    "contact_name": v.contact_name,
                    "headquarters": v.headquarters,
                    "website": v.website,
                    "source": v.source,
                }
                try:
                    await vendors_collection.insert_one(vendor_doc)
                except DuplicateKeyError:
                    # Race condition: vendor was created between check and insert
                    await vendors_collection.update_one(
                        {"vendor_id": vendor_id},
                        {"$push": {"thread_ids": thread_id}},
                    )
                    updated.append(SendDocumentVendorResult(
                        vendor_id=vendor_id,
                        vendor_name=v.vendor_name,
                        thread_id=thread_id,
                    ))
                    continue
                created.append(SendDocumentVendorResult(
                    vendor_id=vendor_id,
                    vendor_name=v.vendor_name,
                    thread_id=thread_id,
                ))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

    return SendDocumentResponse(created_vendors=created, updated_vendors=updated)
