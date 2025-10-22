CREATE TABLE input (
  id SERIAL PRIMARY KEY,
  discipline varchar(255),
  theme TEXT,
  level VARCHAR(100),
  duration VARCHAR(100),
  objective TEXT,
  resources TEXT,
  book varchar(255)
);

CREATE TABLE lesson_plan (
  id SERIAL PRIMARY KEY,
  id_input INT,
  output TEXT,
  FOREIGN KEY (id_input) REFERENCES input(id)
);