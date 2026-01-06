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
