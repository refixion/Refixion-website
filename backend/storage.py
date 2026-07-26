"""Supabase Storage helper -- gebruikt door de product-image upload endpoint.

Praat rechtstreeks met Supabase's Storage REST API via httpx (geen supabase-py
dependency nodig -- httpx staat al in requirements.txt), consistent met de
minimale-dependencies-aanpak van de rest van het project.
"""
import os
import uuid

import httpx
from fastapi import HTTPException, UploadFile

BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "product-images")
ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8MB per afbeelding

# In-memory cache per cold start -- voorkomt dat elke upload opnieuw probeert
# de bucket aan te maken.
_bucket_ready = False


def _config() -> tuple[str, str]:
    base_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base_url or not service_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase Storage is niet geconfigureerd (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ontbreken in de environment variables).",
        )
    return base_url, service_key


async def _ensure_bucket(client: httpx.AsyncClient, base_url: str, service_key: str) -> None:
    """Maakt de 'product-images' bucket idempotent aan als publieke bucket."""
    global _bucket_ready
    if _bucket_ready:
        return
    resp = await client.post(
        f"{base_url}/storage/v1/bucket",
        json={"id": BUCKET, "name": BUCKET, "public": True},
        headers={"Authorization": f"Bearer {service_key}", "apikey": service_key},
    )
    # 200/201 = net aangemaakt, 400 = bestaat al (Supabase geeft dan een
    # duplicate-key foutmelding) -- beide zijn een geldige uitkomst hier.
    if resp.status_code not in (200, 201, 400):
        raise HTTPException(status_code=502, detail="Kon Supabase Storage bucket niet aanmaken")
    _bucket_ready = True


async def upload_product_image(file: UploadFile) -> str:
    """Uploadt één afbeelding naar Supabase Storage en geeft de publieke URL terug."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Ongeldig bestandstype ({file.content_type}). Gebruik JPEG, PNG, WEBP, GIF of HEIC.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Leeg bestand")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Afbeelding is te groot (max 8MB)")

    base_url, service_key = _config()

    ext = ""
    if file.filename and "." in file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()
    object_path = f"{uuid.uuid4()}{ext}"

    async with httpx.AsyncClient(timeout=30) as client:
        await _ensure_bucket(client, base_url, service_key)
        resp = await client.post(
            f"{base_url}/storage/v1/object/{BUCKET}/{object_path}",
            content=data,
            headers={
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
                "Content-Type": file.content_type,
                "x-upsert": "true",
            },
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail="Upload naar Supabase Storage mislukt")

    return f"{base_url}/storage/v1/object/public/{BUCKET}/{object_path}"
