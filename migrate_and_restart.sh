#!/bin/bash

set -e

DB_PATH="/home/ubuntu/Novamailer/backend/novamailer.db"
PYTHON="/home/ubuntu/Novamailer/backend/venv/bin/python3"

echo "🔧 Running SQLite migrations on $DB_PATH..."

$PYTHON << PYEOF
import sqlite3

db = "$DB_PATH"
conn = sqlite3.connect(db)
cur = conn.cursor()

migrations = [
    # Add new columns (ignore error if already exists)
    ("ALTER TABLE campaigns ADD COLUMN scheduled_at DATETIME", "campaigns.scheduled_at"),
    ("ALTER TABLE recipients ADD COLUMN sent_at DATETIME", "recipients.sent_at"),
]

for sql, label in migrations:
    try:
        cur.execute(sql)
        print(f"  ✅ Added: {label}")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print(f"  ⏭  Already exists: {label}")
        else:
            raise

# Create new tables
cur.executescript("""
CREATE TABLE IF NOT EXISTS email_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL REFERENCES recipients(id),
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    tracking_id VARCHAR(64) NOT NULL UNIQUE,
    opened BOOLEAN DEFAULT 0,
    opened_at DATETIME,
    open_count INTEGER DEFAULT 0,
    clicked BOOLEAN DEFAULT 0,
    clicked_at DATETIME,
    click_count INTEGER DEFAULT 0,
    last_clicked_url VARCHAR(2048)
);

CREATE INDEX IF NOT EXISTS ix_email_tracking_tracking_id ON email_tracking(tracking_id);

CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    events JSON NOT NULL,
    secret VARCHAR(255),
    active BOOLEAN DEFAULT 1,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unsubscribes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    unsubscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    campaign_id INTEGER REFERENCES campaigns(id)
);

CREATE TABLE IF NOT EXISTS recipient_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipient_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    data JSON,
    list_id INTEGER NOT NULL REFERENCES recipient_lists(id)
);
""")

conn.commit()
conn.close()

print("  ✅ email_tracking table ready")
print("  ✅ webhooks table ready")
print("  ✅ unsubscribes table ready")
print("  ✅ recipient_lists + recipient_contacts tables ready")
print("")
print("✅ All migrations complete!")
PYEOF

echo ""
echo "🔄 Restarting backend via PM2..."
pm2 restart novamailer-backend

echo ""
echo "✅ Done!"
pm2 status novamailer-backend
