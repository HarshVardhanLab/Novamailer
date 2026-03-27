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
    ("ALTER TABLE campaigns ADD COLUMN scheduled_at DATETIME", "campaigns.scheduled_at"),
    ("ALTER TABLE recipients ADD COLUMN sent_at DATETIME", "recipients.sent_at"),
    ("ALTER TABLE smtp_configs ADD COLUMN auth_type VARCHAR(50) DEFAULT 'password'", "smtp_configs.auth_type"),
    ("ALTER TABLE smtp_configs ADD COLUMN oauth_provider VARCHAR(50)", "smtp_configs.oauth_provider"),
    ("ALTER TABLE smtp_configs ADD COLUMN oauth_access_token VARCHAR(2048)", "smtp_configs.oauth_access_token"),
    ("ALTER TABLE smtp_configs ADD COLUMN oauth_refresh_token VARCHAR(2048)", "smtp_configs.oauth_refresh_token"),
    ("ALTER TABLE smtp_configs ADD COLUMN oauth_token_expires_at DATETIME", "smtp_configs.oauth_token_expires_at"),
    ("ALTER TABLE imap_configs ADD COLUMN auth_type VARCHAR(50) DEFAULT 'password'", "imap_configs.auth_type"),
    ("ALTER TABLE imap_configs ADD COLUMN oauth_provider VARCHAR(50)", "imap_configs.oauth_provider"),
    ("ALTER TABLE imap_configs ADD COLUMN oauth_access_token VARCHAR(2048)", "imap_configs.oauth_access_token"),
    ("ALTER TABLE imap_configs ADD COLUMN oauth_refresh_token VARCHAR(2048)", "imap_configs.oauth_refresh_token"),
    ("ALTER TABLE imap_configs ADD COLUMN oauth_token_expires_at DATETIME", "imap_configs.oauth_token_expires_at"),
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
CREATE TABLE IF NOT EXISTS imap_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 993,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(512) NOT NULL,
    auth_type VARCHAR(50) DEFAULT 'password',
    oauth_provider VARCHAR(50),
    oauth_access_token VARCHAR(2048),
    oauth_refresh_token VARCHAR(2048),
    oauth_token_expires_at DATETIME,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id)
);
""")

conn.commit()
conn.close()

print("  ✅ email_tracking table ready")
print("  ✅ webhooks table ready")
print("  ✅ unsubscribes table ready")
print("  ✅ recipient_lists + recipient_contacts tables ready")
print("  ✅ imap_configs table ready")
print("")
print("✅ All migrations complete!")
print("")
print("⚠️  IMPORTANT: If you have existing SMTP/IMAP passwords,")
print("   run: python migrate_encrypt_passwords.py")
PYEOF

echo ""
echo "🔄 Restarting backend via PM2..."
pm2 restart novamailer-backend

echo ""
echo "✅ Done!"
pm2 status novamailer-backend
