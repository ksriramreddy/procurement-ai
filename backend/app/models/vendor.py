from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VendorCreate(BaseModel):
    vendor_id: str
    vendor_name: str
    thread_ids: list[str] = []
    quoted_price: Optional[int] = None
    technical_compliance_status: bool = False
    certifications_submitted: list[str] = []
    esg_declaration: bool = False
    exceptions_noted: str = ""
    clarifications: list[str] = []
    response_date: Optional[datetime] = None
    vendor_type: Optional[str] = None
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    headquarters: Optional[str] = None
    website: Optional[str] = None
    source: str = "internal"


class VendorUpdate(BaseModel):
    vendor_id: Optional[str] = None
    vendor_name: Optional[str] = None
    thread_ids: Optional[list[str]] = None
    quoted_price: Optional[int] = None
    technical_compliance_status: Optional[bool] = None
    certifications_submitted: Optional[list[str]] = None
    esg_declaration: Optional[bool] = None
    exceptions_noted: Optional[str] = None
    clarifications: Optional[list[str]] = None
    response_date: Optional[datetime] = None
    vendor_type: Optional[str] = None
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    headquarters: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = None


class VendorResponse(BaseModel):
    id: str
    vendor_id: str
    vendor_name: str
    thread_ids: list[str]
    quoted_price: Optional[int]
    technical_compliance_status: bool
    certifications_submitted: list[str]
    esg_declaration: bool
    exceptions_noted: str
    clarifications: list[str]
    response_date: Optional[datetime]
    vendor_type: Optional[str]
    contact_email: Optional[str]
    contact_name: Optional[str]
    headquarters: Optional[str]
    website: Optional[str]
    source: str
