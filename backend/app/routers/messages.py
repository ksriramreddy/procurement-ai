from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from bson import ObjectId
from ..database.connection import messages_collection
from ..models.message import (
    MessageCreate,
    MessageUpdate,
    MessageResponse,
)

router = APIRouter(prefix="/messages", tags=["Messages"])


def doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# PUT - Create a new message
@router.put("/", response_model=MessageResponse)
async def create_message(data: MessageCreate):
    result = await messages_collection.insert_one(data.model_dump())
    created = await messages_collection.find_one({"_id": result.inserted_id})
    return doc_to_response(created)


# GET - Get all messages
@router.get("/", response_model=list[MessageResponse])
async def get_all_messages():
    docs = await messages_collection.find().to_list(1000)
    return [doc_to_response(d) for d in docs]


# GET - Get a single message by ID
@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(message_id: str):
    if not ObjectId.is_valid(message_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    doc = await messages_collection.find_one({"_id": ObjectId(message_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Message not found")
    return doc_to_response(doc)


# GET - Get all messages for a thread
@router.get("/thread/{thread_id}", response_model=list[MessageResponse])
async def get_messages_by_thread(thread_id: str):
    docs = await messages_collection.find({"thread_id": thread_id}).to_list(1000)
    return [doc_to_response(d) for d in docs]


# POST - Update (full replace) a message
@router.post("/{message_id}", response_model=MessageResponse)
async def update_message(message_id: str, data: MessageCreate):
    if not ObjectId.is_valid(message_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await messages_collection.replace_one(
        {"_id": ObjectId(message_id)}, data.model_dump()
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    doc = await messages_collection.find_one({"_id": ObjectId(message_id)})
    return doc_to_response(doc)


# DELETE - Delete a message
@router.delete("/{message_id}")
async def delete_message(message_id: str):
    if not ObjectId.is_valid(message_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    result = await messages_collection.delete_one({"_id": ObjectId(message_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message deleted successfully"}


# PATCH - Partially update a message
@router.patch("/{message_id}", response_model=MessageResponse)
async def patch_message(message_id: str, data: MessageUpdate):
    if not ObjectId.is_valid(message_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await messages_collection.update_one(
        {"_id": ObjectId(message_id)}, {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    doc = await messages_collection.find_one({"_id": ObjectId(message_id)})
    return doc_to_response(doc)


# OPTIONS - Return allowed methods
@router.options("/")
async def options_messages():
    return JSONResponse(
        content={"allowed_methods": ["PUT", "GET", "POST", "DELETE", "PATCH", "OPTIONS"]},
        headers={"Allow": "PUT, GET, POST, DELETE, PATCH, OPTIONS"},
    )
