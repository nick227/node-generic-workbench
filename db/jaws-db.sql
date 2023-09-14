CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    city VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    youtube_url VARCHAR(255),
    homepage_url VARCHAR(255),
    discord_url VARCHAR(255),
    avatar_url VARCHAR(255),
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(255),
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creator_user_id INTEGER REFERENCES user(id)
);

CREATE TABLE offer (
    id SERIAL PRIMARY KEY,
    offer_status VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    payment_amount VARCHAR(255),
    payment_date VARCHAR(50),
    payment_type_id INTEGER,
    payment_conditions VARCHAR(255),
    sender_user_id INTEGER REFERENCES user(id),
    recipient_user_id INTEGER REFERENCES user(id),
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

ALTER TABLE offer 
ADD FOREIGN KEY (payment_type_id) REFERENCES payment_type(id);

CREATE TABLE offer_update (
    id SERIAL PRIMARY KEY,
    offer_status VARCHAR(50),
    offer_id INTEGER REFERENCES offer(id),
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comment (
    id SERIAL PRIMARY KEY,
    creator_user_id INTEGER REFERENCES user(id),
    text TEXT NOT NULL,
    entity_type VARCHAR(50) CHECK (entity_type IN ('offer', 'project')),
    entity_id INTEGER
);
