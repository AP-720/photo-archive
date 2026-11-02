# Adding new photos

New photos go through four stages: a folder of JPEGs, a processing step that resizes them and sorts them by date, an upload to Cloudinary that also records each photo in the database, and a quick check on the live site.

```
recently/  →  process-images.py  →  cloudinary-upload.py  →  check the live site
(JPEGs)       (resize, date,         (Cloudinary + the         (count, dice,
               year/month folders)    Render database)           All Images)
```

The live site reads from the **Render** database, so the upload step has to be pointed at Render. The scripts use your local database unless you say otherwise.

## One-off setup

1. **Dependencies.** From the repo root, with the virtual environment active:

   ```bash
   pip install -r requirements.txt
   ```

2. **Credentials in `.env`.** Put both of these in a `.env` file in the repo root. It is gitignored. Never commit it.

   ```
   CLOUDINARY_URL='paste-the-cloudinary-url-here'
   RENDER_DB_URL='paste-the-render-external-url-here'
   ```

   - `CLOUDINARY_URL` is in your Cloudinary dashboard.
   - `RENDER_DB_URL` is the **External Database URL** from the Render dashboard. It contains the password.
   - No spaces around the `=`, and keep the single quotes. The URL can contain characters like `&` and `?` that the terminal would otherwise misread.

3. **Choose which database a script talks to.** Both `cloudinary-upload.py` and `remove-images.py` connect with:

   ```python
   psycopg.connect(os.getenv("DATABASE_URL", "dbname=ap_archive"))
   ```

   The scripts only ever look for a variable called `DATABASE_URL`. They never read `RENDER_DB_URL`. With no `DATABASE_URL` they use your **local** database. To run them against **Render**, put `DATABASE_URL="$RENDER_DB_URL"` in front of the command (see below). This sets the variable for that one command only.

   **Never name the Render URL `DATABASE_URL` in `.env`.** The scripts load `.env` automatically, so every run would hit production without you choosing to. The different name `RENDER_DB_URL` is what keeps Render opt-in.

## Each time you open a new terminal

Python loads `.env` by itself, but your terminal does not. The commands below use `$RENDER_DB_URL` in the shell (for `pg_dump`, `psql` and the `DATABASE_URL=` prefix), so load the file into the terminal first. From the repo root:

```bash
set -a; source .env; set +a
echo "${RENDER_DB_URL:+set}"
```

The second line should print `set`. If it prints nothing, you are not in the repo root or the line is missing from `.env`.

If you skip this step, `$RENDER_DB_URL` expands to nothing and the upload runs with an empty `DATABASE_URL`, which will not reach Render.

## Step 1: Put the photos in `recently`

Keep the `recently` folder **outside the repo** (for example `~/Desktop/recently`) so photos never end up in a public repository. JPEGs only. Subfolders are fine, as the script searches them all.

## Step 2: Process them

```bash
python3 scripts/process-images.py ~/Desktop/recently ~/Desktop/recently-processed-2026-11-02
```

The first path is the source. The second is the destination, and it **must be new and empty**. If it already holds processed copies, the script adds `_1`, `_2` to filenames and you end up with duplicates. Using the date in the folder name makes each batch its own folder.

For every image, the script:

- fixes the orientation, so photos are not sideways
- shrinks the longest edge to 2000 pixels (smaller images are never enlarged)
- reads the date taken from the photo's EXIF data
- saves it into `year/month/` folders with the **full date** written into the file

**Photos that have no date:** the script stops and asks you to type one in, in the form `YYYY:MM:DD`, then asks you to confirm it. Stay at the terminal while it runs.

**Even already-correct JPEGs must go through this step.** The upload script reads the date from the tag this script writes, and the 2000px size is what the rest of the archive uses.

Check the result:

- The final line says `Done. N succeeded, M failed`, followed by a list of any failed files. Look into those before carrying on.
- The number of files in the processed folder matches the number you put in.
- Open a few and check they are the right way up.

## Step 3: Back up the database

Render keeps 3 days of point-in-time recovery, but a copy of your own lasts as long as you keep it:

```bash
pg_dump "$RENDER_DB_URL" --no-owner --no-acl --file="$HOME/ap_archive_backup.sql"
```

Keep the file outside the repo.

## Step 4: Upload

First note how many photos the live database holds:

```bash
psql "$RENDER_DB_URL" -c "SELECT COUNT(*) FROM images;"
```

Then upload, pointing the script at Render:

```bash
DATABASE_URL="$RENDER_DB_URL" python3 scripts/cloudinary-upload.py ~/Desktop/recently-processed-2026-11-02
```

What you will see:

| Output                   | Meaning                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| A Cloudinary ping result | The credentials in `.env` work                                                              |
| `new - filename.jpg`     | Uploaded and added to the database                                                          |
| `skip - filename.jpg`    | Already in the database (matched by a hash of the file), so nothing was done                |
| `FAILED: ...`            | That file was rolled back. The reason is printed, and the files are listed again at the end |

It is safe to run again after fixing a problem: anything already recorded is skipped. The Cloudinary upload happens before the database insert, so a file that fails on the database step may already be on Cloudinary, and a re-run simply retries it.

## Step 5: Check

1. Run the count again. It should have gone up by the number of `new -` lines.
2. Open the live site. Roll the dice a few times, and check All Images sorted newest first (or oldest first, depending on the dates).
3. The first time a new photo is shown it may load a little slowly, because Cloudinary creates the resized version on the first request.

## Step 6: Tidy up

- Empty or archive `recently`, so the next batch does not include old photos.
- Keep the processed folder as a backup, or delete it. Never reuse it as the destination.

## Removing a photo

```bash
DATABASE_URL="$RENDER_DB_URL" python3 scripts/remove-images.py <public_id> [<public_id> ...]
```

The public ID is the photo's hash, which is the last part of its image URL on Cloudinary (visible in the browser's dev tools), or:

```bash
psql "$RENDER_DB_URL" -c "SELECT public_id, date_taken FROM images WHERE date_taken = '2024-05-12';"
```

The script deletes the database row first and then the image on Cloudinary.

> **Always include the `DATABASE_URL=` prefix.** Without it, the script looks in your local database. If the photo is in your local copy, it deletes it from Cloudinary too, and the live site is left with a row that points to an image that no longer exists.

## Keeping the local database in sync (optional)

The scripts now write to Render, so your local database falls behind. To refresh it from Render:

```bash
pg_dump "$RENDER_DB_URL" --no-owner --no-acl --clean --if-exists --file="$HOME/ap_archive_refresh.sql"
psql ap_archive -f "$HOME/ap_archive_refresh.sql"
```

`--clean --if-exists` drops and recreates the table in your local database, so anything that exists only locally is lost.

## Troubleshooting

| Problem                                                  | Likely cause                                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ModuleNotFoundError`                                    | The virtual environment is not active, or run `pip install -r requirements.txt`                            |
| An error when the Cloudinary ping runs                   | `CLOUDINARY_URL` is missing from `.env`, or you are not running from the repo root                         |
| A database connection or "relation does not exist" error | `RENDER_DB_URL` is empty in this terminal. Run the `set -a; source .env; set +a` line and the `echo` check |
| Photos appeared in the local database instead of Render  | The `DATABASE_URL="$RENDER_DB_URL"` prefix was left off the command                                        |
| `FAILED` with a date error in the upload                 | That file never went through `process-images.py`, so it has no date tag                                    |
| The processing script keeps asking for dates             | Those photos have no date in their EXIF data. Type each in as `YYYY:MM:DD`                                 |
| `source .env` prints errors                              | A line in `.env` has spaces around the `=`, or a value with `&`, `?` or `$` is not in single quotes        |

## Checklist

1. Photos in `~/Desktop/recently`
2. In the repo root: `set -a; source .env; set +a`, then check `echo "${RENDER_DB_URL:+set}"` prints `set`
3. Process into a new, empty folder
4. Check the file count and a few images
5. Back up with `pg_dump`
6. Note the count, then upload with the `DATABASE_URL=` prefix
7. Check the count and the live site
8. Empty `recently`
