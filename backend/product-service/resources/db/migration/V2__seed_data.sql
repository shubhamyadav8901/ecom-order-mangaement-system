-- Categories
INSERT INTO categories (id, name, description)
VALUES
(1, 'Electronics', 'Gadgets and devices'),
(2, 'Books', 'Fiction and non-fiction'),
(3, 'Clothing', 'Apparel and accessories');

-- Reset category sequence
ALTER SEQUENCE categories_id_seq RESTART WITH 4;

-- Products
INSERT INTO products (id, name, description, price, seller_id, status, category_id)
VALUES
(1, 'High-Performance Laptop', '16GB RAM, 512GB SSD, Intel i7', 1299.99, 1, 'ACTIVE', 1),
(2, 'Smartphone X', '128GB Storage, 5G Capable', 799.50, 1, 'ACTIVE', 1),
(3, 'Wireless Headphones', 'Noise cancelling, 20h battery', 149.99, 1, 'ACTIVE', 1),
(4, 'The Great Novel', 'Bestselling fiction book', 19.99, 1, 'ACTIVE', 2),
(5, 'Programming Java', 'Comprehensive guide to Java', 49.95, 1, 'ACTIVE', 2),
(6, 'Cotton T-Shirt', '100% Cotton, Blue', 25.00, 1, 'ACTIVE', 3);

-- Reset product sequence
ALTER SEQUENCE products_id_seq RESTART WITH 7;
