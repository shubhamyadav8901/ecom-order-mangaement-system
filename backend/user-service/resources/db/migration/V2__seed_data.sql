-- Users
-- Password for all users is 'password' (BCrypt hash: $2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG)

TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (id, email, password, first_name, last_name, role)
VALUES
(1, 'admin@example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'Admin', 'User', 'ROLE_ADMIN'),
(2, 'user@example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'John', 'Doe', 'ROLE_CUSTOMER');

-- Reset sequence to avoid collisions if more users are added
ALTER SEQUENCE users_id_seq RESTART WITH 3;
