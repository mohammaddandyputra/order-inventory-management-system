-- Database initialization script with UUID

-- Create orders table
CREATE TABLE IF NOT EXISTS "order" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification table
CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    user_id UUID NOT NULL,
    item_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE SET NULL
);

-- Insert initial inventory data with UUID 
INSERT INTO inventory (id, name, stock) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Laptop Gaming', 10),
('550e8400-e29b-41d4-a716-446655440002', 'Mouse Wireless', 25),
('550e8400-e29b-41d4-a716-446655440003', 'Keyboard Mechanical', 15),
('550e8400-e29b-41d4-a716-446655440004', 'Monitor 24 inch', 8),
('550e8400-e29b-41d4-a716-446655440005', 'Headset Gaming', 20)
ON CONFLICT (id) DO NOTHING;