import sqlite3
conn = sqlite3.connect("showcase.db")
cur = conn.cursor()
for col in ["original_url", "optimized_url", "thumbnail_url"]:
    cur.execute(f"UPDATE design_images SET {col} = REPLACE({col}, 'localhost:8000', 'localhost:8001') WHERE {col} LIKE '%localhost:8000%'")
    print(col, "rows updated:", cur.rowcount)
conn.commit()
conn.close()
