"""
Migration: add `order` column to tasks table.

Run this once against your existing database (local or Supabase) before
deploying the new backend code.

Usage:
    python migrate_add_order.py

The script is idempotent: it skips the ALTER TABLE if the column already exists.
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check if column already exists (works for both PostgreSQL and SQLite)
    if "postgresql" in DATABASE_URL:
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='tasks' AND column_name='order'"
        ))
        exists = result.fetchone() is not None
    else:
        # SQLite
        result = conn.execute(text("PRAGMA table_info(tasks)"))
        exists = any(row[1] == "order" for row in result.fetchall())

    if not exists:
        conn.execute(text('ALTER TABLE tasks ADD COLUMN "order" INTEGER'))
        # Backfill existing rows with their current rowid order
        conn.execute(text(
            'UPDATE tasks SET "order" = id'
        ))
        conn.commit()
        print("✓ Column `order` added and backfilled.")
    else:
        print("✓ Column `order` already exists, nothing to do.")
