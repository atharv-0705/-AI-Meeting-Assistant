FROM python:3.11-slim

# Install ffmpeg for audio processing
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU-only PyTorch first to save space and prevent OOM errors during build
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose port (Render sets PORT environment variable)
EXPOSE 10000

# Command to run the application using Render's PORT variable
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
