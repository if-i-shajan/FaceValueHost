FROM python:3.11-slim

# System dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend-ai/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend-ai/ .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
