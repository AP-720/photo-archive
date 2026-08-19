import sys
from pathlib import Path
from PIL import Image
from PIL.ExifTags import IFD, Base

Image.MAX_IMAGE_PIXELS = 200_000_000

folder_path = sys.argv[1]

image_paths = Path(folder_path).iterdir() 

suffixes = [".jpeg", '.jpg', '.png', '.tif', '.tiff', '.webp', '.gif']
ready = []
needs_date = []

for image_path in image_paths:
    suffix = image_path.suffix.lower()
    if suffix  in suffixes:
        with Image.open(image_path) as img:
            exif = img.getexif()
            exif_ifd = exif.get_ifd(IFD.Exif)
            date_taken = exif_ifd.get(Base.DateTimeOriginal)
            width, height = img.size
            if date_taken is None:
                needs_date.append({'image_path': image_path, 'date_taken': None, 'width': width, 'height': height})
            else:
                ready.append({'image_path': image_path, 'date_taken': date_taken,'width': width, 'height': height})

print(f"Ready: {len(ready)}")
print(f"Needs date: {len(needs_date)}")