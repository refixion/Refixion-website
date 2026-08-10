ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS paid_at TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
ON orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id
ON orders(stripe_session_id);