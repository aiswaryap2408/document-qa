from pydantic import BaseModel, field_validator, Field
import re
from typing import Optional

class MobileRequest(BaseModel):
    mobile: str

    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v):
        if not re.match(r'^\d{10}$', v):
            raise ValueError('Mobile number must be exactly 10 digits')
        return v

class OTPRequest(BaseModel):
    mobile: str
    otp: str

    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v):
        if not re.match(r'^\d{10}$', v):
            raise ValueError('Mobile number must be exactly 10 digits')
        return v

class UserRegistration(BaseModel):
    name: str = Field(..., min_length=1)
    gender: str = Field(..., min_length=1)
    dob: str = Field(..., min_length=1) # YYYY-MM-DD
    tob: str = Field(..., min_length=1) # HH:MM or HH:MM:SS
    pob: str = Field(..., min_length=1)
    mobile: str
    email: str = Field(..., min_length=1)
    chart_style: str = Field(..., min_length=1)
    
    # Location-related optional fields
    country: Optional[str] = ''
    state: Optional[str] = ''
    region_dist: Optional[str] = ''
    txt_place_search: Optional[str] = ''
    longdeg: Optional[str] = ''
    longmin: Optional[str] = ''
    longdir: Optional[str] = ''
    latdeg: Optional[str] = ''
    latmin: Optional[str] = ''
    latdir: Optional[str] = ''
    timezone: Optional[str] = '0'
    timezone_name: Optional[str] = ''
    latitude_google: Optional[str] = ''
    longitude_google: Optional[str] = ''
    correction: Optional[str] = '0'

    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v):
        if not re.match(r'^\d{10}$', v):
            raise ValueError('Mobile number must be exactly 10 digits')
        return v

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_profile: dict

class Transaction(BaseModel):
    transaction_id: str
    mobile: str
    amount: float
    type: str # credit / debit
    category: Optional[str] = None # recharge, dakshina, etc
    status: str # pending, success, failed
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    description: Optional[str] = None
    timestamp: float

class WebhookLog(BaseModel):
    event_id: str
    payload: dict
    timestamp: float
