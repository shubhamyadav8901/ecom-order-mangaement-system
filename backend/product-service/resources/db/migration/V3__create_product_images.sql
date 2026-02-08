CREATE TABLE product_images (
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
