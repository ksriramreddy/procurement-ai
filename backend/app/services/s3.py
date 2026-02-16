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


def upload_file_to_s3(file_bytes: bytes, original_filename: str, document_type: str) -> str:
    """Upload a file to S3 and return the public URL."""
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

    url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
    return url


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
