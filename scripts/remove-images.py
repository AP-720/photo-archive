import os
import sys

import psycopg
from dotenv import load_dotenv

load_dotenv()

import cloudinary
import cloudinary.uploader

cloudinary_url = os.getenv("CLOUDINARY_URL")
config = cloudinary.config(secure=True)

public_ids = sys.argv[1:]

with psycopg.connect("dbname=ap_archive") as conn, conn.cursor() as cur:
    failed = []

    for public_id in public_ids:
        try:
            cur.execute(
                "DELETE FROM images WHERE public_id = %(id)s RETURNING public_id",
                {"id": public_id},
            )
            removed = cur.fetchall()
            conn.commit()

            if len(removed) != 0:
                response = cloudinary.uploader.destroy(public_id, invalidate=True)
                print(f"removed {public_id} (cloudinary: {response['result']})")
            else:
                print(f"not found: {public_id}")

        except Exception as error:
            conn.rollback()
            print(f"FAILED: {public_id} - {error}")
            failed.append(public_id)


if failed:
    print("Failed files:")
    for public_id in failed:
        print(f"  {public_id}")
