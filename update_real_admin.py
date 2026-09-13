import sqlite3

conn = sqlite3.connect('campusbuddy.db')
cursor = conn.cursor()
cursor.execute("UPDATE users SET full_name = 'Admin' WHERE id = 1")
conn.commit()
conn.close()
print("Updated Admin name in real database.")
