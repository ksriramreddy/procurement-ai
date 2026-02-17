from fastapi import APIRouter, HTTPException
from bson import ObjectId
from ..database.connection import internal_vendors_collection

router = APIRouter(prefix="/internal-vendors", tags=["Internal Vendors"])


def doc_to_response(doc: dict) -> dict:
    """Convert MongoDB document to response by converting _id to id"""
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


# GET - Get all internal vendors
@router.get("/")
async def get_all_internal_vendors():
    """Fetch all internal vendors"""
    docs = await internal_vendors_collection.find().to_list(1000)
    return [doc_to_response(d) for d in docs]


# GET - Get vendor by MongoDB _id
@router.get("/{vendor_id}")
async def get_internal_vendor(vendor_id: str):
    """Get a single internal vendor by MongoDB _id"""
    if not ObjectId.is_valid(vendor_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    doc = await internal_vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Internal vendor not found")
    return doc_to_response(doc)


# GET - Get vendor by vendor_id field (flexible search - top-level or nested)
@router.get("/by-vendor-id/{vid}")
async def get_internal_vendor_by_vendor_id(vid: str):
    """Get internal vendor by vendor_id field with flexible search"""
    # Try to find vendor with vendor_id at top level
    doc = await internal_vendors_collection.find_one({"vendor_id": vid})
    
    # If not found, try nested in vendor_profile
    if not doc:
        doc = await internal_vendors_collection.find_one({"vendor_profile.vendor_id": vid})
    
    # If still not found, return placeholder with "Data Not Available" status
    if not doc:
        return {
            "id": None,
            "vendor_profile": {
                "vendor_id": vid,
                "vendor_name": vid,
                "status": "Data Not Available",
                "vendor_type": "Unknown"
            },
            "services_offered": [],
            "certifications_and_compliance": {},
            "commercial_details": {},
            "procurement_engagements": {},
            "performance_metrics": {},
            "risk_and_compliance_scores": {},
            "financial_summary": {}
        }
    
    return doc_to_response(doc)


# GET - Get all vendor IDs for debugging
@router.get("/search/all-ids")
async def get_all_internal_vendor_ids():
    """Get all available vendor IDs in the internal_vendors collection"""
    docs = await internal_vendors_collection.find().to_list(1000)
    vendor_ids = []
    
    for doc in docs:
        # Check for vendor_id at top level
        if "vendor_id" in doc:
            vendor_ids.append(doc["vendor_id"])
        # Check for vendor_id in nested vendor_profile
        elif "vendor_profile" in doc and "vendor_id" in doc["vendor_profile"]:
            vendor_ids.append(doc["vendor_profile"]["vendor_id"])
    
    return {
        "total": len(vendor_ids),
        "vendor_ids": vendor_ids,
        "collection": "internal_vendors"
    }
