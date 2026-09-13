import sqlite3

conn = sqlite3.connect('campusbuddy.db')
cursor = conn.cursor()
cursor.execute("SELECT student_id, code, is_active FROM parent_link_codes")
for row in cursor.fetchall():
    print(row)
conn.close()
