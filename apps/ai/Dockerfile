FROM python:3.10-slim

# Install system dependencies required by OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all model files and Python code
COPY . .

# Set environment variables (Hugging Face requires port 7860)
ENV MODEL_SERVICE_HOST=0.0.0.0
ENV MODEL_SERVICE_PORT=7860

EXPOSE 7860

# Run the FastAPI server
CMD ["python", "app.py"]
