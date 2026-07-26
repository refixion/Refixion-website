"""Admin-only endpoint voor het uploaden van productafbeeldingen naar Supabase
Storage. Eigen module, zoals shop_routes.py, zodat hij los in server.py kan
worden ge-include-d zonder bestaande routes aan te raken.
"""
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from auth import get_current_admin
from storage import upload_product_image

router = APIRouter(prefix="/api/upload", tags=["Upload"])


@router.post("/product-image")
async def upload_product_images(
    files: List[UploadFile] = File(...),
    _: dict = Depends(get_current_admin),
):
    """Uploadt 1 of meer afbeeldingen naar Supabase Storage.

    Response: {"urls": ["https://.../product-images/<uuid>.jpg", ...]}

    Eén mislukte upload in een batch faalt de hele request (400/502) -- dat
    voorkomt dat de admin een gedeeltelijk gelukte set afbeeldingen te zien
    krijgt zonder dat duidelijk is welke ontbreken.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Geen bestanden ontvangen")

    urls = [await upload_product_image(f) for f in files]
    return {"urls": urls}
