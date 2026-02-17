from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from bson import ObjectId
from ..database.connection import contracts_collection
from ..models.contract import (
    ContractCreate,
    ContractUpdate,
    ContractResponse,
)

router = APIRouter(prefix="/contracts", tags=["Contracts"])


def doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# PUT - Create a new contract
@router.put("/", response_model=ContractResponse)
async def create_contract(data: ContractCreate):
    result = await contracts_collection.insert_one(data.model_dump())
    created = await contracts_collection.find_one({"_id": result.inserted_id})
    return doc_to_response(created)


# GET - Get all contracts
@router.get("/", response_model=list[ContractResponse])
async def get_all_contracts():
    docs = await contracts_collection.find().to_list(1000)
    return [doc_to_response(d) for d in docs]


# GET - Get a single contract by MongoDB _id
@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    doc = await contracts_collection.find_one({"_id": ObjectId(contract_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found")
    return doc_to_response(doc)


# GET - Get contract by contract_id field
@router.get("/by-contract-id/{cid}", response_model=ContractResponse)
async def get_contract_by_id(cid: str):
    doc = await contracts_collection.find_one({"contract_id": cid})
    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found")
    return doc_to_response(doc)


# POST - Update (full replace) a contract
@router.post("/{contract_id}", response_model=ContractResponse)
async def update_contract(contract_id: str, data: ContractCreate):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await contracts_collection.replace_one(
        {"_id": ObjectId(contract_id)}, data.model_dump()
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    doc = await contracts_collection.find_one({"_id": ObjectId(contract_id)})
    return doc_to_response(doc)


# PATCH - Partially update a contract
@router.patch("/{contract_id}", response_model=ContractResponse)
async def patch_contract(contract_id: str, data: ContractUpdate):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await contracts_collection.update_one(
        {"_id": ObjectId(contract_id)}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    doc = await contracts_collection.find_one({"_id": ObjectId(contract_id)})
    return doc_to_response(doc)


# DELETE - Delete a contract
@router.delete("/{contract_id}")
async def delete_contract(contract_id: str):
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await contracts_collection.delete_one({"_id": ObjectId(contract_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"message": "Contract deleted successfully"}


# OPTIONS - Return allowed methods
@router.options("/")
async def options_contracts():
    return JSONResponse(
        content={"allowed_methods": ["PUT", "GET", "POST", "DELETE", "PATCH", "OPTIONS"]},
    )
