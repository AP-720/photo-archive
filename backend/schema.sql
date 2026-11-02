CREATE TABLE images (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hash varchar(255) NOT NULL UNIQUE,
    public_id varchar(255) NOT NULL,
    date_taken date NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL
);