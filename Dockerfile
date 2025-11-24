FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy everything from the repo
COPY . .

# Install Python dependencies
RUN cd backend && pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 8080

# Start command
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT

