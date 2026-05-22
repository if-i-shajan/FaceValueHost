"""
Face Processing Service using InsightFace + OpenCV
Handles: detection, alignment, cropping, embedding extraction
"""

import io
import logging
import numpy as np
import cv2
from PIL import Image, ImageFilter
from typing import Optional, Tuple, Dict, Any
import asyncio

logger = logging.getLogger(__name__)


class FaceProcessor:
    """AI-powered face processing pipeline"""

    def __init__(self):
        self.app = None
        self.initialized = False

    async def initialize(self):
        """Load InsightFace model"""
        try:
            import insightface
            from insightface.app import FaceAnalysis

            loop = asyncio.get_event_loop()
            self.app = await loop.run_in_executor(
                None,
                self._load_model
            )
            self.initialized = True
            logger.info("InsightFace model loaded successfully")
        except ImportError:
            logger.warning("InsightFace not available. Using OpenCV fallback.")
            self.initialized = True
        except Exception as e:
            logger.error(f"Failed to load InsightFace: {e}")
            self.initialized = True  # Allow fallback mode

    def _load_model(self):
        try:
            from insightface.app import FaceAnalysis
            app = FaceAnalysis(
                name='buffalo_l',
                allowed_modules=['detection', 'recognition'],
                providers=['CPUExecutionProvider']
            )
            app.prepare(ctx_id=0, det_size=(640, 640))
            return app
        except Exception as e:
            logger.warning(f"InsightFace load failed: {e}")
            return None

    def detect_faces_opencv(self, img_array: np.ndarray) -> list:
        """Fallback face detection using OpenCV Haar cascade"""
        gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
        return faces if len(faces) > 0 else []

    def is_blurry(self, img_array: np.ndarray, threshold: float = 100.0) -> bool:
        """Detect blur using Laplacian variance"""
        gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        return variance < threshold

    def is_low_resolution(self, img_array: np.ndarray, min_size: int = 100) -> bool:
        h, w = img_array.shape[:2]
        return h < min_size or w < min_size

    async def process_image(
        self,
        image_data: bytes,
        target_size: int = 512,
    ) -> Dict[str, Any]:
        """
        Full face processing pipeline:
        1. Load image
        2. Detect faces
        3. Validate
        4. Align & crop
        5. Resize to 512x512
        6. Convert to WEBP
        7. Return results
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._process_sync, image_data, target_size)

    def _process_sync(self, image_data: bytes, target_size: int) -> Dict[str, Any]:
        result = {
            "hasFace": False,
            "faceCount": 0,
            "isBlurry": False,
            "isLowResolution": False,
            "confidence": 0.0,
            "warnings": [],
            "processedImage": None,
            "thumbnailImage": None,
            "faceEmbedding": None,
            "width": 0,
            "height": 0,
            "format": "webp",
        }

        try:
            # Load image
            img_pil = Image.open(io.BytesIO(image_data)).convert("RGB")
            img_array = np.array(img_pil)
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

            h, w = img_bgr.shape[:2]
            result["width"] = w
            result["height"] = h

            # Check resolution
            if self.is_low_resolution(img_bgr):
                result["isLowResolution"] = True
                result["warnings"].append("Image resolution is too low (minimum 100x100 pixels)")

            # Check blur
            if self.is_blurry(img_bgr):
                result["isBlurry"] = True
                result["warnings"].append("Image appears blurry")

            # Face detection
            faces = []
            embedding = None

            if self.app is not None:
                # InsightFace detection
                faces_insight = self.app.get(img_bgr)
                faces = faces_insight

                if len(faces_insight) > 0:
                    result["faceCount"] = len(faces_insight)
                    result["hasFace"] = True
                    result["confidence"] = float(faces_insight[0].det_score)

                    if hasattr(faces_insight[0], 'normed_embedding'):
                        embedding = faces_insight[0].normed_embedding.tolist()
                        result["faceEmbedding"] = embedding

                    if len(faces_insight) > 1:
                        result["warnings"].append(f"Multiple faces detected ({len(faces_insight)}). Please ensure only one face per image.")
            else:
                # OpenCV fallback
                cv_faces = self.detect_faces_opencv(img_bgr)
                if len(cv_faces) > 0:
                    result["faceCount"] = len(cv_faces)
                    result["hasFace"] = True
                    result["confidence"] = 0.85
                    faces = cv_faces

                    if len(cv_faces) > 1:
                        result["warnings"].append(f"Multiple faces detected ({len(cv_faces)}).")

            if not result["hasFace"]:
                result["warnings"].append("No face detected in image")
                # Still process without crop
                processed = self._resize_and_convert(img_pil, target_size)
                result["processedImage"] = processed
                result["thumbnailImage"] = self._resize_and_convert(img_pil, 128)
                return result

            # Crop face region
            cropped = self._crop_face(img_pil, img_bgr, faces)
            processed = self._resize_and_convert(cropped, target_size)
            thumbnail = self._resize_and_convert(cropped, 128)

            result["processedImage"] = processed
            result["thumbnailImage"] = thumbnail

        except Exception as e:
            logger.error(f"Image processing error: {e}")
            result["warnings"].append(f"Processing error: {str(e)}")

        return result

    def _crop_face(self, img_pil: Image.Image, img_bgr: np.ndarray, faces) -> Image.Image:
        """Crop face with padding for forehead and shoulders"""
        w, h = img_pil.size

        if hasattr(faces[0], 'bbox'):
            # InsightFace format
            bbox = faces[0].bbox.astype(int)
            x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
        else:
            # OpenCV format [x, y, w, h]
            face = faces[0]
            x1, y1 = face[0], face[1]
            x2, y2 = x1 + face[2], y1 + face[3]

        face_w = x2 - x1
        face_h = y2 - y1

        # Add padding: 40% top for forehead, 20% sides, 30% bottom for chin/shoulder
        pad_top = int(face_h * 0.5)
        pad_side = int(face_w * 0.25)
        pad_bottom = int(face_h * 0.35)

        crop_x1 = max(0, x1 - pad_side)
        crop_y1 = max(0, y1 - pad_top)
        crop_x2 = min(w, x2 + pad_side)
        crop_y2 = min(h, y2 + pad_bottom)

        cropped = img_pil.crop((crop_x1, crop_y1, crop_x2, crop_y2))

        # Make square
        cw, ch = cropped.size
        size = max(cw, ch)
        square = Image.new("RGB", (size, size), (128, 128, 128))
        square.paste(cropped, ((size - cw) // 2, (size - ch) // 2))

        return square

    def _resize_and_convert(self, img: Image.Image, size: int) -> bytes:
        """Resize image and convert to WEBP bytes"""
        resized = img.resize((size, size), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, format="WEBP", quality=85, method=6)
        return buf.getvalue()

    def compute_similarity(self, emb1: list, emb2: list) -> float:
        """Cosine similarity between two face embeddings"""
        a = np.array(emb1)
        b = np.array(emb2)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))
