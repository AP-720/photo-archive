import hashlib
import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

load_dotenv()

from datetime import datetime

import cloudinary
import cloudinary.api
import cloudinary.uploader
from PIL import Image
from PIL.ExifTags import Base

cloudinary_url = os.getenv("CLOUDINARY_URL")
config = cloudinary.config(secure=True)

print(cloudinary.api.ping())

folder_path = Path(sys.argv[1])


def hash_file(path):
    with open(path, "rb") as f:
        data = f.read()

    return hashlib.sha256(data).hexdigest()


def get_date_taken(path):
    with Image.open(path) as img:
        raw = img.getexif().get(Base.DateTime)

    return datetime.strptime(raw, "%Y:%m:%d %H:%M:%S").date()


with psycopg.connect("dbname=ap_archive") as conn, conn.cursor() as cur:
    cur.execute("SELECT hash FROM images")
    rows = cur.fetchall()
    hashes = {row[0] for row in rows}
    # print(hashes)

    failed = []
    for file in folder_path.rglob("*.jpg"):
        hashed_file = hash_file(file)
        if hashed_file in hashes:
            print(f"skip - {file.name}")
        else:
            try:
                response = cloudinary.uploader.upload(
                    str(file), public_id=hashed_file, overwrite=False
                )
                public_id = response["public_id"]
                width = response["width"]
                height = response["height"]
                date_taken = get_date_taken(file)
                print(date_taken)
                cur.execute(
                    "INSERT INTO images (hash, public_id, date_taken, width,height) VALUES (%s, %s, %s, %s, %s)",
                    (hashed_file, public_id, date_taken, width, height),
                )
                conn.commit()
                hashes.add(hashed_file)
                print(f"new - {file.name}")
            except Exception as error:
                conn.rollback()
                print(f"FAILED: {file} - {error}")
                failed.append(file)

    if failed:
        print("Failed files:")
        for path in failed:
            print(f"  {path}")


# python3 scripts/cloudinary-upload.py "/Users/andyprice/Desktop/full_archive_images_processed/2008"
