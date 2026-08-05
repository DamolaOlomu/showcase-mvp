import sqlite3
conn = sqlite3.connect("showcase.db")
cur = conn.cursor()
cur.execute("SELECT sql FROM sqlite_master WHERE name='design_images'")
print(cur.fetchone())
conn.close()
