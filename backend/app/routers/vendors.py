from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from bson import ObjectId
from ..database.connection import vendors_collection
from ..models.vendor import (
    VendorCreate,
    VendorUpdate,
    VendorResponse,
)

router = APIRouter(prefix="/vendors", tags=["Vendors"])


def doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# PUT - Create a new vendor
@router.put("/", response_model=VendorResponse)
async def create_vendor(data: VendorCreate):
    result = await vendors_collection.insert_one(data.model_dump())
    created = await vendors_collection.find_one({"_id": result.inserted_id})
    return doc_to_response(created)


# GET - Get all vendors
@router.get("/", response_model=list[VendorResponse])
async def get_all_vendors():
    docs = await vendors_collection.find().to_list(1000)
    return [doc_to_response(d) for d in docs]


# GET - Get a single vendor by MongoDB _id
@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: str):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    doc = await vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return doc_to_response(doc)


# GET - Get vendor by vendor_id field (email)
@router.get("/by-vendor-id/{vid}", response_model=VendorResponse)
async def get_vendor_by_vendor_id(vid: str):
    doc = await vendors_collection.find_one({"vendor_id": vid})
    if not doc:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return doc_to_response(doc)


# POST - Update (full replace) a vendor
@router.post("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: str, data: VendorCreate):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await vendors_collection.replace_one(
        {"_id": ObjectId(vendor_id)}, data.model_dump()
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    doc = await vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    return doc_to_response(doc)


# PATCH - Partially update a vendor
@router.patch("/{vendor_id}", response_model=VendorResponse)
async def patch_vendor(vendor_id: str, data: VendorUpdate):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await vendors_collection.update_one(
        {"_id": ObjectId(vendor_id)}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    doc = await vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    return doc_to_response(doc)


# DELETE - Delete a vendor
@router.delete("/{vendor_id}")
async def delete_vendor(vendor_id: str):
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await vendors_collection.delete_one({"_id": ObjectId(vendor_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor deleted successfully"}


# OPTIONS - Return allowed methods
@router.options("/")
async def options_vendors():
    return JSONResponse(
        content={"allowed_methods": ["PUT", "GET", "POST", "DELETE", "PATCH", "OPTIONS"]},
        headers={"Allow": "PUT, GET, POST, DELETE, PATCH, OPTIONS"},
    )
