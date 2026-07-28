"""
Batch 1 doesn't include the admin dashboard yet (that's Batch 5), but new
designs are created with status=pending and won't show up in the gallery
until approved. Use this script during local dev to approve everything
pending so you can see your own submissions.

Run from the backend/ directory:
    python scripts/approve_design.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime
from app.database import SessionLocal
from app import models

db = SessionLocal()
pending = db.query(models.Design).filter(models.Design.status == models.DesignStatus.pending).all()

if not pending:
    print("No pending designs.")
else:
    for design in pending:
        design.status = models.DesignStatus.approved
        design.published_at = datetime.utcnow()
        print(f"Approved: {design.title} ({design.slug})")
    db.commit()

db.close()
