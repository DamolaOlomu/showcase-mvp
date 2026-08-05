import sqlite3
conn = sqlite3.connect("showcase.db")
cur = conn.cursor()
cur.execute("SELECT id, original_url, optimized_url, thumbnail_url FROM design_images LIMIT 5")
for row in cur.fetchall():
    print(row)
conn.close()
