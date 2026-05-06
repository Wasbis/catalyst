FROM python:3.10-slim

# Install system dependencies (dibutuhkan untuk build beberapa package Python)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# Copy requirements dan install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download model sentence-transformers saat build biar nggak download berkali-kali saat container restart
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy seluruh source code
COPY ./app /code/app

# Jalankan Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]