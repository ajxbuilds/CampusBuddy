import sqlite3

conn = sqlite3.connect('campusbuddy.db')
cursor = conn.cursor()
cursor.execute("SELECT id, full_name, email, role FROM users WHERE id=10")
print(cursor.fetchone())
conn.close()
