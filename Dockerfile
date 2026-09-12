FROM brainicism/bgutil-ytdlp-pot-provider:latest AS pot_source

FROM python:3.11-slim

# Install system dependencies, ffmpeg, curl, and Node.js 22
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ffmpeg ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy pre-built POT provider HTTP server from official image
COPY --from=pot_source /app /opt/pot-provider

WORKDIR /app

# Install CPU-only PyTorch first to save space and prevent OOM errors during build
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Ensure start script has executable permissions
RUN chmod +x ./start.sh

# Expose ports (FastAPI on 10000, POT Provider on 4416)
EXPOSE 10000
EXPOSE 4416

# Command to run both POT server and FastAPI app via start script
CMD ["./start.sh"]
