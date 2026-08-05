# Microsoft's official Playwright image ships Python, matching Chromium
# binaries, and every system library they need already installed and
# tested together — avoids the OS/package-name mismatches you get trying
# to bolt Playwright onto a generic python:slim base. Version must match
# the playwright== pin in requirements.txt.
FROM mcr.microsoft.com/playwright/python:v1.47.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Browsers are already included in this base image, but this confirms/
# repairs them against the exact version pip just installed — cheap
# no-op if already present, and guards against version drift.
RUN playwright install chromium

COPY . .

# Render sets $PORT at runtime; default to 8000 for local docker run/testing.
ENV PORT=8000
EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}