<<<<<<< HEAD
FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

# Create instance dir for SQLite
RUN mkdir -p instance

=======
# Solomon v4.0 - Production Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create instance directory for SQLite
RUN mkdir -p instance

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_ENV=production \
    PORT=5000

>>>>>>> 7df27e1 (feat: Complete production setup with website + deployment)
# Expose port
EXPOSE 5000

# Health check
<<<<<<< HEAD
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:5000/api/health')" || exit 1

# Run with gunicorn
CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
=======
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Run with gunicorn (production WSGI server)
CMD ["gunicorn", "wsgi:app", \
     "--bind", "0.0.0.0:5000", \
     "--workers", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
>>>>>>> 7df27e1 (feat: Complete production setup with website + deployment)
