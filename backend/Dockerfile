FROM python:3.11-slim

WORKDIR /app

# System deps needed to build a couple of Python packages (e.g. cryptography,
# Pillow) before wheels are found, kept minimal since most deps ship wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Playwright's own installer + --with-deps pulls in every system library
# Chromium needs (fonts, codecs, etc). Running as root inside our own
# image build (not Render's shared sandbox) means this actually has the
# permissions it needs to apt-get install things.
RUN playwright install --with-deps chromium

COPY . .

# Render sets $PORT at runtime; default to 8000 for local docker run/testing.
ENV PORT=8000
EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}