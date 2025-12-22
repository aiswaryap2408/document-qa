from pydantic import BaseModel, field_validator
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
    name: str
    gender: str
    dob: str # YYYY-MM-DD
    tob: str # HH:MM or HH:MM:SS
    pob: str
    mobile: str
    email: str
    chart_style: str

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
