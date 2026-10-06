"""
scripts/process-images.py

Processes a flat folder of source images (hard-drive backlog or a batch of
new photos) into web-ready JPEGs, sorted into a year/month folder structure
based on the date each photo was taken.

For each image, this script:
    1. Opens the file
    2. Corrects orientation using the image's EXIF data, and removes the
       orientation tag so viewers don't rotate it a second time
    3. Handles an unusual TIFF pixel format ("mode I") that would otherwise
       silently convert to a black/garbled image
    4. Preserves the image's embedded colour profile (ICC profile), if any
    5. Resizes the image so its longest edge is at most MAX_DIMENSION
       pixels, without ever enlarging a smaller image
    6. Reads the date the photo was taken from its EXIF data, asking you to
       type it in by hand if it's missing (same validate-and-confirm loop
       already used in cloudinary-upload.py)
    7. Saves the result as a JPEG inside <destination_root>/<year>/<month>/

One bad file won't crash the whole run - failures are collected and printed
at the end, so you can go investigate just those.

Usage:
    python3 scripts/process-images.py <source_folder> <destination_root>

Example:
    python3 scripts/process-images.py ~/Desktop/old-hard-drive ~/Desktop/sorted-archive

This hasn't been run against your real archive yet - test it on a small,
deliberately awkward sample first (a rotated phone photo, a TIFF, an
already-small image) before pointing it at the full backlog.
"""

import sys
from pathlib import Path
from datetime import datetime

from PIL import Image, ImageOps
from PIL.ExifTags import IFD, Base

# Pillow refuses to open very large images by default, as a safety measure
# against "decompression bomb" files (a tiny file that decompresses into
# something huge enough to exhaust memory). Some hard-drive TIFFs are large
# enough to trip that check, so we raise the limit. Mirrors the same line
# already used in cloudinary-upload.py.
Image.MAX_IMAGE_PIXELS = 200_000_000

# The longest edge any saved image is allowed to be, in pixels. Comfortably
# larger than anything the gallery will display, while cutting the file size
# of full-resolution originals considerably.
MAX_DIMENSION = 2000

# JPEG quality used when saving. 85 is a common balance point between
# visible quality and file size; Pillow's own default is 75 if you don't
# specify one.
JPEG_QUALITY = 85

# File extensions this script will attempt to process. Matches the list
# already used in cloudinary-upload.py.
VALID_SUFFIXES = {".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp", ".gif"}


def fix_orientation(img):
    """
    Returns a copy of `img` with any EXIF orientation applied to the actual
    pixels, and the orientation tag removed from the result.

    Why this matters: an image's orientation is often stored as metadata (an
    "Orientation" tag) rather than by physically rotating the pixel data. If
    you resize or re-save an image without addressing that tag, some viewers
    will still read the leftover tag and rotate the image AGAIN on top of
    pixels that are now correctly oriented already - producing a sideways or
    upside-down photo. exif_transpose() does both halves of the fix in one
    call: it rotates the pixels AND strips the now-redundant tag.

    Note: exif_transpose() returns a NEW image object rather than modifying
    `img` in place (unless you pass in_place=True, which we don't here) - so
    the return value, not the original `img`, is what every later step needs
    to use.
    """
    return ImageOps.exif_transpose(img)


def fix_mode(img):
    """
    Returns an image guaranteed to be in a normal, displayable pixel mode.

    Why this matters: most images are mode "RGB" (three 8-bit colour
    channels) or "L" (8-bit grayscale) - both convert to JPEG without
    trouble. Some TIFFs, particularly from older scanners, are saved in mode
    "I" instead, which stores each pixel as a 32-bit integer. Converting a
    mode "I" image straight to "RGB" with img.convert("RGB") does NOT
    rescale those larger pixel values down into the 0-255 range a JPEG
    expects - the result is usually an almost entirely black image, with no
    error or warning raised. The file "works"; the content is silently
    wrong.

    The fix is to manually rescale pixel values down to the 0-255 range
    before converting modes. img.point(...) applies a function to every
    pixel; dividing by 256 brings the actual stored range (0-65535, despite
    the mode being labelled 32-bit) down into the 0-255 range a normal image
    expects.
    """
    if img.mode == "I":
        img = img.point(lambda pixel_value: pixel_value * (1 / 256)).convert("L")
    return img


def get_date_taken(img, image_path):
    """
    Returns a (year, month) tuple as strings, e.g. ("2021", "03").

    Tries to read the date from the image's EXIF data first. DateTimeOriginal
    lives in a NESTED block of EXIF data (the "Exif IFD"), not in the
    top-level tags getexif() returns directly - the same quirk already
    worked around in cloudinary-upload.py.

    If no date is found (common for some phone exports, or scans with EXIF
    stripped), you're prompted to type one in by hand, with the same
    validate-and-confirm loop already used in cloudinary-upload.py. This
    logic has moved here from that script, since the date is needed at
    processing/sorting time, not at upload time.
    """
    exif = img.getexif()
    exif_ifd = exif.get_ifd(IFD.Exif)
    date_taken = exif_ifd.get(Base.DateTimeOriginal)

    if date_taken is None:
        print(f"No date found for: {image_path}")
        while True:
            date_response = input("Enter date (YYYY:MM:DD): ")
            try:
                parsed_date = datetime.strptime(date_response, "%Y:%m:%d")
            except ValueError:
                print("Invalid date format, try again.")
                continue
            confirmation = input(
                f"Confirm {parsed_date.strftime('%Y:%m:%d')} is correct? y/n: "
            )
            if confirmation.lower() == "y":
                break
    else:
        # EXIF dates are formatted "YYYY:MM:DD HH:MM:SS" - only the date
        # portion is needed, so split off the time before parsing.
        parsed_date = datetime.strptime(date_taken.split(" ")[0], "%Y:%m:%d")

    return parsed_date.strftime("%Y"), parsed_date.strftime("%m")


def unique_destination_path(destination_folder, filename):
    """
    Returns a path inside `destination_folder` guaranteed not to already
    exist, appending "_1", "_2", etc. to the filename if needed.

    Why this matters: hard-drive images and phone images come from two
    separate sources, so there's a real chance two unrelated files share the
    exact same filename (e.g. two different "IMG_0001" files). Without this
    check, the second one processed would silently overwrite the first
    inside the shared year/month folder, and an image would be lost without
    any error being raised.
    """
    destination_path = destination_folder / filename
    stem, suffix = destination_path.stem, destination_path.suffix
    counter = 1
    while destination_path.exists():
        destination_path = destination_folder / f"{stem}_{counter}{suffix}"
        counter += 1
    return destination_path


def process_image(image_path, destination_root):
    """
    Runs one image through the full pipeline: open, fix orientation, fix
    mode, resize, extract date, and save into
    destination_root/<year>/<month>/.
    """
    with Image.open(image_path) as img:
        # Grab the ICC colour profile (if one exists) before any processing.
        # Resizing and mode changes don't alter the profile itself, but
        # Pillow's save() won't carry it over automatically unless it's
        # explicitly passed back in at save time.
        icc_profile = img.info.get("icc_profile")

        img = fix_orientation(img)
        img = fix_mode(img)

        # thumbnail() resizes the image to fit within the given box
        # (MAX_DIMENSION x MAX_DIMENSION), preserving the original aspect
        # ratio, and modifies `img` IN PLACE (unlike exif_transpose, which
        # returns a new object). It will never enlarge an image that's
        # already smaller than the target size, so there's no need for a
        # manual "is this already small enough?" check.
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))

        year, month = get_date_taken(img, image_path)

        destination_folder = destination_root / year / month
        destination_folder.mkdir(parents=True, exist_ok=True)

        # Every image is being standardised to JPEG here regardless of its
        # original format, so the output always gets a .jpg extension.
        output_filename = image_path.stem + ".jpg"
        destination_path = unique_destination_path(destination_folder, output_filename)

        # JPEG doesn't support a transparency (alpha) channel or a colour
        # palette, so a PNG/GIF opened in mode "RGBA" or "P" needs converting
        # to plain RGB before saving, or Pillow will raise an error here.
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        save_kwargs = {"quality": JPEG_QUALITY}
        if icc_profile:
            save_kwargs["icc_profile"] = icc_profile

        img.save(destination_path, "JPEG", **save_kwargs)
        print(f"Saved: {destination_path}")


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 scripts/process-images.py <source_folder> <destination_root>")
        sys.exit(1)

    source_folder = Path(sys.argv[1])
    destination_root = Path(sys.argv[2])

    # rglob("*") walks every subfolder, however deep, rather than just the
    # top level like iterdir() does. This lets the same script handle both
    # of the real sources as-is: a flat folder of phone exports (no
    # subfolders, so this behaves just like iterdir() would), and the
    # hard-drive archive, which already sits in its own year/month folders.
    # is_file() filters out the directories themselves (e.g. "2021", "03"),
    # which rglob would otherwise also return.
    image_paths = [
        p for p in source_folder.rglob("*")
        if p.is_file() and p.suffix.lower() in VALID_SUFFIXES
    ]

    print(f"Found {len(image_paths)} image(s) to process.\n")

    failed = []
    for image_path in image_paths:
        try:
            process_image(image_path, destination_root)
        except Exception as error:
            # One bad file shouldn't crash a run of several thousand images -
            # at that scale, at least one unexpected file is near-certain.
            # Failures are collected and reported at the end instead, so you
            # can go investigate just those.
            print(f"FAILED: {image_path} - {error}")
            failed.append(image_path)

    print(f"\nDone. {len(image_paths) - len(failed)} succeeded, {len(failed)} failed.")
    if failed:
        print("Failed files:")
        for path in failed:
            print(f"  {path}")


if __name__ == "__main__":
    main()