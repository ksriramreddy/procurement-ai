from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VendorComplianceCreate(BaseModel):
    vendor_id: str
    session_id: str
    thread_id: str
    quoted_price: int
    technical_compliance_status: bool = False
    certifications_submitted: list[str] = []
    esg_declaration: bool = False
    exceptions_noted: str = ""
    clarifications: list[str] = []
    response_date: datetime = Field(default_factory=datetime.utcnow)


class VendorComplianceUpdate(BaseModel):
    vendor_id: Optional[str] = None
    session_id: Optional[str] = None
    thread_id: Optional[str] = None
    quoted_price: Optional[int] = None
    technical_compliance_status: Optional[bool] = None
    certifications_submitted: Optional[list[str]] = None
    esg_declaration: Optional[bool] = None
    exceptions_noted: Optional[str] = None
    clarifications: Optional[list[str]] = None
    response_date: Optional[datetime] = None


class VendorComplianceResponse(BaseModel):
    id: str
    vendor_id: str
    session_id: str
    thread_id: str
    quoted_price: int
    technical_compliance_status: bool
    certifications_submitted: list[str]
    esg_declaration: bool
    exceptions_noted: str
    clarifications: list[str]
    response_date: datetime
