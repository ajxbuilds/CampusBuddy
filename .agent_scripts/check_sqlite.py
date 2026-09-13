import sqlite3

conn = sqlite3.connect('campusbuddy.db')
cursor = conn.cursor()
cursor.execute("SELECT full_name FROM users WHERE id=1")
print("Admin Name:", cursor.fetchone()[0])

try:
    cursor.execute("SELECT COUNT(*) FROM parent_link_codes")
    print("ParentLinkCode count:", cursor.fetchone()[0])
except Exception as e:
    print("Error:", e)

conn.close()
