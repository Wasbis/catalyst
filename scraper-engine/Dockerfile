FROM python:3.10-slim

WORKDIR /code

# Install torch CPU-only duluan (versi default CUDA ~2GB, kelamaan didownload)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements dan install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download model sentence-transformers saat build biar nggak download berkali-kali saat container restart
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy seluruh source code
COPY ./api /code/api

# Jalankan Uvicorn
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]


