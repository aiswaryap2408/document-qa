from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/api/places", tags=["places"])

class PlaceRequest(BaseModel):
    place_id: str
    place_name: str

@router.get("/details")
async def get_place_details(place_id: str):
    """
    Proxy endpoint to fetch Google Places details from ClickAstro API
    This avoids CORS issues when calling from the browser
    """
    try:
        # url = f"https://www.clickastro.com/js/gp_api/?t=place-details&placeid={place_id}"
        url = f"https://maps.googleapis.com/maps/api/place/details/json?placeid={place_id}&key=AIzaSyBsezfT-nI598TzbtEo_atslIysKiL5NHM"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            return response.json()
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"ClickAstro API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to ClickAstro API: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
