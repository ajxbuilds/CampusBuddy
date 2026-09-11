import sqlite3
import os

db_path = "campusbuddy.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(document_records)")
    columns = [col[1] for col in cur.fetchall()]
    print("Existing columns in document_records:", columns)
    
    new_cols = [
        ("original_filename", "VARCHAR(255)"),
        ("mime_type", "VARCHAR(100)"),
        ("storage_path", "VARCHAR(500)")
    ]
    for col_name, col_type in new_cols:
        if col_name not in columns:
            print(f"Adding column {col_name} {col_type}...")
            cur.execute(f"ALTER TABLE document_records ADD COLUMN {col_name} {col_type}")
    
    conn.commit()
    conn.close()
    print("Migration complete.")
else:
    print("campusbuddy.db not found.")
