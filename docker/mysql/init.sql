-- Initial bootstrap: grants and charset.
-- Schema is managed by Alembic migrations, not here.

ALTER DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON ecommerce.* TO 'ecom'@'%';
FLUSH PRIVILEGES;
