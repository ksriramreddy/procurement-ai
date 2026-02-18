from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from ..services.s3 import upload_file_to_s3, generate_presigned_url
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
        result = upload_file_to_s3(file_bytes, file.filename, document_type)
        s3_key = result["s3_key"]
        presigned_url = result["url"]

        # Save message to MongoDB — store the S3 key for future presigned URL generation
        message_doc = {
            "message": f"{document_type} Document",
            "attachment": [s3_key],
            "thread_id": thread_id,
            "sender": "customer",
        }
        db_result = await messages_collection.insert_one(message_doc)

        return {
            "s3_url": presigned_url,
            "s3_key": s3_key,
            "message_id": str(db_result.inserted_id),
            "thread_id": thread_id,
            "document_type": document_type,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/presign")
async def get_presigned_url(s3_key: str = Query(...)):
    """Generate a presigned URL for an existing S3 object (7-day expiry)."""
    try:
        url = generate_presigned_url(s3_key)
        return {"url": url, "s3_key": s3_key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
