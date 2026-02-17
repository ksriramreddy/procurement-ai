from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ContractCreate(BaseModel):
    contract_id: str
    vendor_id: str
    vendor_name: str
    service_category: str
    services_provided: list[str] = []
    contract_value_usd: float
    billing_model: str
    monthly_cost_usd: float
    contract_start_date: str
    contract_end_date: str
    contract_status: str
    department: str
    business_unit: str
    payment_terms: str
    renewal_type: str
    risk_level: str


class ContractUpdate(BaseModel):
    contract_id: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor_name: Optional[str] = None
    service_category: Optional[str] = None
    services_provided: Optional[list[str]] = None
    contract_value_usd: Optional[float] = None
    billing_model: Optional[str] = None
    monthly_cost_usd: Optional[float] = None
    contract_start_date: Optional[str] = None
    contract_end_date: Optional[str] = None
    contract_status: Optional[str] = None
    department: Optional[str] = None
    business_unit: Optional[str] = None
    payment_terms: Optional[str] = None
    renewal_type: Optional[str] = None
    risk_level: Optional[str] = None


class ContractResponse(BaseModel):
    id: str
    contract_id: str
    vendor_id: str
    vendor_name: str
    service_category: str
    services_provided: list[str]
    contract_value_usd: float
    billing_model: str
    monthly_cost_usd: float
    contract_start_date: str
    contract_end_date: str
    contract_status: str
    department: str
    business_unit: str
    payment_terms: str
    renewal_type: str
    risk_level: str
