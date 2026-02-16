from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from bson import ObjectId
from ..database.connection import vendor_compliances_collection
from ..models.vendor_compliance import (
    VendorComplianceCreate,
    VendorComplianceUpdate,
    VendorComplianceResponse,
)

router = APIRouter(prefix="/vendor-compliances", tags=["Vendor Compliances"])


def doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# PUT - Create a new vendor compliance record
@router.put("/", response_model=VendorComplianceResponse)
async def create_vendor_compliance(data: VendorComplianceCreate):
    result = await vendor_compliances_collection.insert_one(data.model_dump())
    created = await vendor_compliances_collection.find_one({"_id": result.inserted_id})
    return doc_to_response(created)


# GET - Get all vendor compliance records
@router.get("/", response_model=list[VendorComplianceResponse])
async def get_all_vendor_compliances():
    docs = await vendor_compliances_collection.find().to_list(1000)
    return [doc_to_response(d) for d in docs]


# GET - Get a single vendor compliance by ID
@router.get("/{compliance_id}", response_model=VendorComplianceResponse)
async def get_vendor_compliance(compliance_id: str):
    if not ObjectId.is_valid(compliance_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    doc = await vendor_compliances_collection.find_one({"_id": ObjectId(compliance_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Vendor compliance not found")
    return doc_to_response(doc)


# POST - Update (full replace) a vendor compliance record
@router.post("/{compliance_id}", response_model=VendorComplianceResponse)
async def update_vendor_compliance(compliance_id: str, data: VendorComplianceCreate):
    if not ObjectId.is_valid(compliance_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await vendor_compliances_collection.replace_one(
        {"_id": ObjectId(compliance_id)}, data.model_dump()
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor compliance not found")
    doc = await vendor_compliances_collection.find_one({"_id": ObjectId(compliance_id)})
    return doc_to_response(doc)


# DELETE - Delete a vendor compliance record
@router.delete("/{compliance_id}")
async def delete_vendor_compliance(compliance_id: str):
    if not ObjectId.is_valid(compliance_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await vendor_compliances_collection.delete_one({"_id": ObjectId(compliance_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor compliance not found")
    return {"message": "Vendor compliance deleted successfully"}


# PATCH - Partially update a vendor compliance record
@router.patch("/{compliance_id}", response_model=VendorComplianceResponse)
async def patch_vendor_compliance(compliance_id: str, data: VendorComplianceUpdate):
    if not ObjectId.is_valid(compliance_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await vendor_compliances_collection.update_one(
        {"_id": ObjectId(compliance_id)}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor compliance not found")
    doc = await vendor_compliances_collection.find_one({"_id": ObjectId(compliance_id)})
    return doc_to_response(doc)


# OPTIONS - Return allowed methods
@router.options("/")
async def options_vendor_compliances():
    return JSONResponse(
        content={"allowed_methods": ["PUT", "GET", "POST", "DELETE", "PATCH", "OPTIONS"]},
        headers={"Allow": "PUT, GET, POST, DELETE, PATCH, OPTIONS"},
    )
