"""Firebase Admin SDK integration"""
import os
import logging
import firebase_admin
from firebase_admin import credentials, firestore, storage as fb_storage, auth as fb_auth

logger = logging.getLogger(__name__)
_db = None
_bucket = None


def init_firebase():
    global _db, _bucket
    if firebase_admin._apps:
        return

    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        # Try application default credentials
        try:
            cred = credentials.ApplicationDefault()
        except Exception:
            logger.warning("No Firebase credentials found. Running in mock mode.")
            return

    firebase_admin.initialize_app(cred, {
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", ""),
    })
    _db = firestore.client()
    _bucket = fb_storage.bucket()
    logger.info("Firebase Admin initialized")


def get_db():
    return _db


def get_bucket():
    return _bucket


def _decrypt_admin_password(encrypted_password: str, key: str) -> str | None:
    """Decrypt admin password using Fernet when available."""
    try:
        from cryptography.fernet import Fernet
    except Exception:
        logger.warning("cryptography not installed; cannot decrypt ADMIN_PASSWORD_ENC")
        return None

    try:
        return Fernet(key.encode("utf-8")).decrypt(encrypted_password.encode("utf-8")).decode("utf-8")
    except Exception:
        logger.warning("Failed to decrypt ADMIN_PASSWORD_ENC; check key and value")
        return None


def _get_admin_credentials() -> tuple[str, str]:
    """Resolve admin credentials from environment with secure fallback."""
    email = os.getenv("ADMIN_EMAIL", "admin@gmail.com")
    password = os.getenv("ADMIN_PASSWORD")

    if not password:
        enc_password = os.getenv("ADMIN_PASSWORD_ENC")
        enc_key = os.getenv("ADMIN_PASSWORD_KEY")
        if enc_password and enc_key:
            password = _decrypt_admin_password(enc_password, enc_key)

    if not password:
        password = "admin@123"

    return email, password


async def update_photo_doc(photo_id: str, data: dict):
    """Update a photo document in Firestore"""
    if _db is None:
        logger.warning(f"Mock: Would update photo {photo_id} with {data.keys()}")
        return
    _db.collection("photos").document(photo_id).update(data)


async def upload_processed_image(
    data: bytes,
    path: str,
    content_type: str = "image/webp"
) -> str:
    """Upload processed image to Firebase Storage and return download URL"""
    if _bucket is None:
        logger.warning(f"Mock: Would upload to {path}")
        return f"https://mock-storage.example.com/{path}"

    blob = _bucket.blob(path)
    blob.upload_from_string(data, content_type=content_type)
    blob.make_public()
    return blob.public_url


async def setup_initial_admin(email: str | None = None, password: str | None = None):
    """Create initial admin user with custom claims"""
    if _db is None:
        logger.warning("Firebase not initialized - skipping admin setup")
        return

    if email is None or password is None:
        default_email, default_password = _get_admin_credentials()
        email = email or default_email
        password = password or default_password

    try:
        # Check if user already exists
        try:
            user = fb_auth.get_user_by_email(email)
            logger.info(f"Admin user {email} already exists with UID: {user.uid}")
            # Update custom claims if not set
            if not user.custom_claims or user.custom_claims.get('role') != 'admin':
                fb_auth.set_custom_user_claims(user.uid, {'role': 'admin'})
                logger.info(f"Updated custom claims for {email}")
            return
        except fb_auth.UserNotFoundError:
            pass

        # Create new admin user
        user = fb_auth.create_user(email=email, password=password)
        logger.info(f"Created new admin user: {email} (UID: {user.uid})")

        # Set admin custom claims
        fb_auth.set_custom_user_claims(user.uid, {'role': 'admin'})
        logger.info(f"Set admin role for {email}")

        # Create user profile in Firestore
        _db.collection("users").document(user.uid).set({
            "uid": user.uid,
            "email": email,
            "name": "Administrator",
            "role": "admin",
            "createdAt": firestore.SERVER_TIMESTAMP,
            "isFlagged": False,
            "qualityScore": 100,
        })
        logger.info(f"Created admin profile in Firestore for {email}")

    except Exception as e:
        logger.error(f"Error setting up admin user: {e}")
