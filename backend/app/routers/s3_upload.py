from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..services.s3 import upload_file_to_s3
from ..database.connection import messages_collection

router = APIRouter(prefix="/s3-upload", tags=["S3 Upload"])


@router.post("/")
async def upload_to_s3(
    file: UploadFile = File(...),
    document_type: str = Form("RFQ"),
    thread_id: str = Form(...),
):
    """Upload an RFQ/RFP file to S3 and save a message record in MongoDB."""
    try:
        file_bytes = await file.read()
        s3_url = upload_file_to_s3(file_bytes, file.filename, document_type)

        # Save message to MongoDB
        message_doc = {
            "message": f"{document_type} Document",
            "attachment": [s3_url],
            "thread_id": thread_id,
            "sender": "customer",
        }
        result = await messages_collection.insert_one(message_doc)

        return {
            "s3_url": s3_url,
            "message_id": str(result.inserted_id),
            "thread_id": thread_id,
            "document_type": document_type,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
