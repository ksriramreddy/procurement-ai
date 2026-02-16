from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class CertificationItem(BaseModel):
    certificate: str
    is_submitted: str = ""


def _normalize_certs(v):
    """Convert old string format to CertificationItem dicts for backwards compat."""
    if not v:
        return []
    result = []
    for item in v:
        if isinstance(item, str):
            result.append({"certificate": item, "is_submitted": ""})
        else:
            result.append(item)
    return result


class EmailThreadCreate(BaseModel):
    thread_id: str = ""
    vendor_id: str
    subject: str
    document_type: str = ""
    mandatory: list[CertificationItem] = []
    good_to_have: list[CertificationItem] = []
    summary: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator('mandatory', 'good_to_have', mode='before')
    @classmethod
    def normalize_certs(cls, v):
        return _normalize_certs(v)


class EmailThreadUpdate(BaseModel):
    thread_id: Optional[str] = None
    vendor_id: Optional[str] = None
    subject: Optional[str] = None
    document_type: Optional[str] = None
    mandatory: Optional[list[CertificationItem]] = None
    good_to_have: Optional[list[CertificationItem]] = None
    summary: Optional[str] = None
    created_at: Optional[datetime] = None

    @field_validator('mandatory', 'good_to_have', mode='before')
    @classmethod
    def normalize_certs(cls, v):
        if v is None:
            return v
        return _normalize_certs(v)


class EmailThreadResponse(BaseModel):
    id: str
    thread_id: str = ""
    vendor_id: str
    subject: str
    document_type: str = ""
    mandatory: list[CertificationItem] = []
    good_to_have: list[CertificationItem] = []
    summary: str = ""
    created_at: Optional[datetime] = None

    @field_validator('mandatory', 'good_to_have', mode='before')
    @classmethod
    def normalize_certs(cls, v):
        return _normalize_certs(v)
