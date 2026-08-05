"""
One-time data migration: SQLite (showcase.db) -> Supabase Postgres.

Run from the backend/ directory, with your venv active:
    python migrate_to_supabase.py

Prerequisites:
- .env DATABASE_URL already points at Supabase (tables should already
  exist there, created via `Base.metadata.create_all` on app startup).
- showcase.db.backup (or showcase.db) still present locally with your
  real data.
"""

from sqlalchemy import create_engine, select, insert
from sqlalchemy.orm import sessionmaker

from app.models import (
    Base, User, Design, DesignImage, Tag, Like, Save, Follow, design_tags,
)

# --- Connections -------------------------------------------------------

SQLITE_URL = "sqlite:///./showcase.db.backup"  # change to ./showcase.db if you didn't rename it
sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

# Reads DATABASE_URL from your already-updated .env via app.config
from app.config import settings  # noqa: E402
pg_engine = create_engine(settings.database_url)

SqliteSession = sessionmaker(bind=sqlite_engine)
PgSession = sessionmaker(bind=pg_engine)

sqlite_db = SqliteSession()
pg_db = PgSession()

# Tables already created by Base.metadata.create_all on app startup,
# but this is a harmless no-op safety net.
Base.metadata.create_all(pg_engine)

# --- Migration order matters: parents before children -------------------
# Users and Tags have no FK dependencies -> migrate first.
# Design depends on User. DesignImage/Like/Save depend on Design (and User).
# Follow depends on User (twice). design_tags depends on Design + Tag.

MODELS_IN_ORDER = [User, Tag, Design, DesignImage, Like, Save, Follow]

for model in MODELS_IN_ORDER:
    rows = sqlite_db.query(model).all()
    count = 0
    for row in rows:
        sqlite_db.expunge(row)  # detach from source session before merging into target
        pg_db.merge(row)
        count += 1
    pg_db.commit()
    print(f"Migrated {count} rows for {model.__name__}")

# --- Association table (design_tags) is a plain Table, not a mapped class ---
# Copy it directly at the Core level.

assoc_rows = sqlite_db.execute(select(design_tags)).mappings().all()
if assoc_rows:
    # Clear first in case this script is re-run (idempotency safety)
    pg_db.execute(design_tags.delete())
    pg_db.execute(insert(design_tags), [dict(r) for r in assoc_rows])
    pg_db.commit()
print(f"Migrated {len(assoc_rows)} rows for design_tags (association table)")

# --- Verification: row counts side by side ------------------------------

print("\n--- Verification ---")
for model in MODELS_IN_ORDER:
    sqlite_count = sqlite_db.query(model).count()
    pg_count = pg_db.query(model).count()
    status = "OK" if sqlite_count == pg_count else "MISMATCH"
    print(f"{model.__name__:15s} sqlite={sqlite_count:5d}  postgres={pg_count:5d}  [{status}]")

sqlite_assoc_count = len(assoc_rows)
pg_assoc_count = pg_db.execute(select(design_tags)).rowcount if False else len(pg_db.execute(select(design_tags)).all())
status = "OK" if sqlite_assoc_count == pg_assoc_count else "MISMATCH"
print(f"{'design_tags':15s} sqlite={sqlite_assoc_count:5d}  postgres={pg_assoc_count:5d}  [{status}]")

sqlite_db.close()
pg_db.close()
print("\nDone.")