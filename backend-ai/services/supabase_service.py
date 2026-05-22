"""Supabase integration for database and storage."""
import logging
import os
from typing import Any, Iterable

from supabase import create_client, Client

logger = logging.getLogger(__name__)

_client: Client | None = None
_supabase_url: str | None = None


def init_supabase() -> None:
    global _client, _supabase_url
    if _client is not None:
        return

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    _supabase_url = supabase_url

    if not supabase_url or not supabase_key:
        logger.warning("Supabase not configured; missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return

    _client = create_client(supabase_url, supabase_key)
    logger.info("Supabase initialized")


def get_client() -> Client | None:
    return _client


def get_bucket() -> str:
    return os.getenv("SUPABASE_STORAGE_BUCKET", "photos")


def public_url(path: str) -> str:
    if not _supabase_url:
        return ""
    bucket = get_bucket()
    return f"{_supabase_url}/storage/v1/object/public/{bucket}/{path}"


def upload_image_bytes(data: bytes, path: str, content_type: str = "image/webp") -> str:
    if _client is None:
        raise RuntimeError("Supabase is not configured")

    bucket = get_bucket()
    storage = _client.storage.from_(bucket)
    storage.upload(
        path,
        data,
        {
            "content-type": content_type,
            "upsert": True,
        },
    )
    return public_url(path)


def remove_storage_paths(paths: Iterable[str]) -> None:
    if _client is None:
        return
    bucket = get_bucket()
    storage = _client.storage.from_(bucket)
    storage.remove(list(paths))


def update_photo_record(photo_id: str, data: dict[str, Any]) -> None:
    if _client is None:
        logger.warning("Supabase not configured; photo update skipped")
        return
    _client.table("photos").update(data).eq("id", photo_id).execute()


def get_photo_record(photo_id: str) -> dict[str, Any] | None:
    if _client is None:
        return None
    res = _client.table("photos").select("*").eq("id", photo_id).execute()
    if not res.data:
        return None
    return res.data[0]


def find_photos_by_survey(survey_id: str) -> list[dict[str, Any]]:
    if _client is None:
        return []
    res = _client.table("photos").select("*").eq("survey_id", survey_id).execute()
    return res.data or []


def set_user_role_by_email(email: str, role: str = "admin") -> bool:
    if _client is None:
        return False
    res = _client.table("users").update({"role": role}).eq("email", email).execute()
    return bool(res.data)
