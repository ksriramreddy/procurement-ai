import os
import uuid
from datetime import datetime
import boto3
from dotenv import load_dotenv

load_dotenv()

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)

BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "lyzr-procurement")
FOLDER_PREFIX = "LYZR procurement"


def upload_file_to_s3(file_bytes: bytes, original_filename: str, document_type: str) -> dict:
    """Upload a file to S3 and return the S3 key + a presigned URL."""
    ext = os.path.splitext(original_filename)[1] if original_filename else ".pdf"
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    s3_key = f"{FOLDER_PREFIX}/{document_type}/{timestamp}_{unique_id}{ext}"

    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=file_bytes,
        ContentType=_get_content_type(ext),
    )

    presigned_url = generate_presigned_url(s3_key)
    return {"s3_key": s3_key, "url": presigned_url}


def generate_presigned_url(s3_key: str, expires_in: int = 604800) -> str:
    """Generate a presigned URL for an S3 object. Default expiry: 7 days (604800s)."""
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": s3_key},
        ExpiresIn=expires_in,
    )


def _get_content_type(ext: str) -> str:
    mapping = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }
    return mapping.get(ext.lower(), "application/octet-stream")
