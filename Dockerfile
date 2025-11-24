FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy all files (Railway root directory is already /backend)
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create startup script that uses PORT or defaults to 8080
RUN printf '#!/bin/sh\nPORT=${PORT:-8080}\nexec python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT\n' > /start.sh && chmod +x /start.sh

# Start command
CMD ["/start.sh"]

