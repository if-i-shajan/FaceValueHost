"""Cloudinary storage integration"""
import io
import logging
import os
import re
from pathlib import Path
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader

logger = logging.getLogger(__name__)

_configured = False
_folder_prefix = ""


def init_cloudinary() -> None:
    """Initialize Cloudinary configuration from environment variables."""
    global _configured, _folder_prefix

    cloudinary_url = os.getenv("CLOUDINARY_URL")
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    folder = os.getenv("CLOUDINARY_FOLDER", "").strip().strip("/")
    _folder_prefix = folder

    if cloudinary_url:
        cloudinary.config(cloudinary_url=cloudinary_url, secure=True)
        _configured = True
        logger.info("Cloudinary initialized via CLOUDINARY_URL")
        return

    if not (cloud_name and api_key and api_secret):
        _configured = False
        logger.warning("Cloudinary not configured; missing env vars")
        return

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    _configured = True
    logger.info("Cloudinary initialized")


def is_configured() -> bool:
    return _configured


def _public_id_and_format(path: str) -> tuple[str, str | None]:
    normalized = path.strip("/").replace("\\", "/")
    p = Path(normalized)
    ext = p.suffix.lstrip(".").lower() or None
    public_id = p.with_suffix("").as_posix()
    if _folder_prefix:
        public_id = f"{_folder_prefix}/{public_id}"
    return public_id, ext


def upload_bytes(data: bytes, path: str, content_type: str = "image/webp") -> str:
    """Upload image bytes to Cloudinary and return a secure URL."""
    if not _configured:
        raise RuntimeError("Cloudinary is not configured")

    public_id, ext = _public_id_and_format(path)
    result = cloudinary.uploader.upload(
        io.BytesIO(data),
        public_id=public_id,
        format=ext,
        resource_type="image",
        overwrite=True,
        unique_filename=False,
        invalidate=True,
    )
    return result.get("secure_url") or result.get("url") or ""


def is_cloudinary_url(url: str) -> bool:
    try:
        host = urlparse(url).netloc
    except Exception:
        return False
    return "res.cloudinary.com" in host


def extract_public_id(url: str) -> str | None:
    """Extract public_id from a Cloudinary URL."""
    try:
        path = urlparse(url).path
    except Exception:
        return None

    match = re.search(r"/upload/(?:[^/]+/)*?v\d+/(.+)$", path)
    if not match:
        match = re.search(r"/upload/(.+)$", path)
    if not match:
        return None

    public_with_ext = match.group(1)
    public_id = re.sub(r"\.[A-Za-z0-9]+$", "", public_with_ext)
    return public_id or None


def delete_by_url(url: str) -> bool:
    if not _configured or not url or not is_cloudinary_url(url):
        return False

    public_id = extract_public_id(url)
    if not public_id:
        return False

    result = cloudinary.uploader.destroy(
        public_id,
        resource_type="image",
        invalidate=True,
    )
    return result.get("result") in {"ok", "not found"}
