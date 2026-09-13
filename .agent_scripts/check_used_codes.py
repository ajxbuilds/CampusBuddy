import sqlite3

conn = sqlite3.connect('campusbuddy.db')
cursor = conn.cursor()
cursor.execute("SELECT code, is_active, used_at, used_by_parent_id FROM parent_link_codes")
for row in cursor.fetchall():
    print(row)
conn.close()
