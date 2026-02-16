from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from bson import ObjectId
from ..database.connection import email_threads_collection
from ..models.email_thread import (
    EmailThreadCreate,
    EmailThreadUpdate,
    EmailThreadResponse,
)


class UpdateCertStatusRequest(BaseModel):
    thread_id: str
    certificate: str
    field: str          # "mandatory" or "good_to_have"
    is_submitted: str   # e.g. "VALID", "NOT_VALID", "UNABLE_TO_VERIFY"

router = APIRouter(prefix="/email-threads", tags=["Email Threads"])


def doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# PUT - Create a new email thread
@router.put("/", response_model=EmailThreadResponse)
async def create_email_thread(data: EmailThreadCreate):
    result = await email_threads_collection.insert_one(data.model_dump())
    created = await email_threads_collection.find_one({"_id": result.inserted_id})
    return doc_to_response(created)


# GET - Get all email threads
@router.get("/", response_model=list[EmailThreadResponse])
async def get_all_email_threads():
    docs = await email_threads_collection.find().to_list(1000)
    return [doc_to_response(d) for d in docs]


# GET - Get all threads for a vendor (query param to support URL-based vendor_ids)
@router.get("/by-vendor", response_model=list[EmailThreadResponse])
async def get_threads_by_vendor(vendor_id: str = Query(...)):
    docs = await email_threads_collection.find({"vendor_id": vendor_id}).to_list(1000)
    return [doc_to_response(d) for d in docs]


# GET - Get a single email thread by ID
@router.get("/{thread_id}", response_model=EmailThreadResponse)
async def get_email_thread(thread_id: str):
    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    doc = await email_threads_collection.find_one({"_id": ObjectId(thread_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Email thread not found")
    return doc_to_response(doc)


# POST - Update (full replace) an email thread
@router.post("/{thread_id}", response_model=EmailThreadResponse)
async def update_email_thread(thread_id: str, data: EmailThreadCreate):
    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await email_threads_collection.replace_one(
        {"_id": ObjectId(thread_id)}, data.model_dump()
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Email thread not found")
    doc = await email_threads_collection.find_one({"_id": ObjectId(thread_id)})
    return doc_to_response(doc)


# DELETE - Delete an email thread
@router.delete("/{thread_id}")
async def delete_email_thread(thread_id: str):
    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await email_threads_collection.delete_one({"_id": ObjectId(thread_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Email thread not found")
    return {"message": "Email thread deleted successfully"}


# PATCH - Partially update an email thread
@router.patch("/{thread_id}", response_model=EmailThreadResponse)
async def patch_email_thread(thread_id: str, data: EmailThreadUpdate):
    if not ObjectId.is_valid(thread_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await email_threads_collection.update_one(
        {"_id": ObjectId(thread_id)}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Email thread not found")
    doc = await email_threads_collection.find_one({"_id": ObjectId(thread_id)})
    return doc_to_response(doc)


# PUT - Update certification submission status in a thread
@router.put("/cert-status")
async def update_cert_status(data: UpdateCertStatusRequest):
    if data.field not in ("mandatory", "good_to_have"):
        raise HTTPException(status_code=400, detail="field must be 'mandatory' or 'good_to_have'")

    result = await email_threads_collection.update_one(
        {"thread_id": data.thread_id, f"{data.field}.certificate": data.certificate},
        {"$set": {f"{data.field}.$.is_submitted": data.is_submitted}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Thread or certificate not found")
    return {"message": "Certificate status updated", "thread_id": data.thread_id, "certificate": data.certificate, "is_submitted": data.is_submitted}


# OPTIONS - Return allowed methods
@router.options("/")
async def options_email_threads():
    return JSONResponse(
        content={"allowed_methods": ["PUT", "GET", "POST", "DELETE", "PATCH", "OPTIONS"]},
        headers={"Allow": "PUT, GET, POST, DELETE, PATCH, OPTIONS"},
    )
