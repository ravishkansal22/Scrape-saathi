# Multi-stage Python Container for ScrapSetu Backend
FROM python:3.11-slim

WORKDIR /app

# Install python dependencies with retries and timeout to avoid socket hangs
COPY requirements.txt /app/
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=100 --retries=10 -r requirements.txt

# Copy backend source code
COPY . /app/

# Create directory for persistent local database storage
RUN mkdir -p /app/data

# Expose FastAPI port
EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8000
ENV DATA_DIR=/app/data

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

