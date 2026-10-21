import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class SeenIds(BaseModel):
    ids: list[int] = []


SORTORDER = {"ASC": "date_taken ASC, id ASC", "DESC": "date_taken DESC, id DESC"}
FLOOR = 0.05


@app.post("/random")
def random(seen_ids: SeenIds, weight: float = 0.5, limit: int = 50):
    limit_add_one = limit + 1
    with psycopg.connect("dbname=ap_archive", row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "WITH bounds AS ( SELECT MIN(EXTRACT(EPOCH FROM date_taken)) AS min_e, MAX(EXTRACT(EPOCH FROM date_taken)) AS max_e FROM images), scored AS ( SELECT i.id, i.public_id, i.date_taken, i.width, i.height, ((EXTRACT(EPOCH FROM i.date_taken) - b.min_e) / (b.max_e - b.min_e))::float8 AS date_score FROM images i, bounds b) SELECT id, public_id, date_taken, width, height FROM scored WHERE id <> ALL(%(seen)s) ORDER BY power( random(), 1.0 / (%(floor)s + (1 - %(floor)s) * (%(weight)s * date_score + (1 - %(weight)s) * (1 - date_score)))) DESC LIMIT %(limit)s;",
                {
                    "seen": seen_ids.ids,
                    "weight": weight,
                    "limit": limit_add_one,
                    "floor": FLOOR,
                },
            )
            rows = cur.fetchall()
        has_more = len(rows) > limit
        batch = rows[:limit]
        return {"photos": batch, "hasMore": has_more}


@app.get("/all-images")
def all_images(sort: str, offset: int, limit: int = 50):
    order_sql = SORTORDER.get(sort)
    if order_sql is None:
        raise HTTPException(status_code=400, detail="Unknown sort value")
    limit_add_one = limit + 1
    with psycopg.connect("dbname=ap_archive", row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, public_id, date_taken, width, height FROM images ORDER BY {order_sql} OFFSET %(offset)s LIMIT %(limit)s;",
                {
                    "offset": offset,
                    "limit": limit_add_one,
                },
            )
            rows = cur.fetchall()
        has_more = len(rows) > limit
        batch = rows[:limit]
        return {"photos": batch, "hasMore": has_more}
