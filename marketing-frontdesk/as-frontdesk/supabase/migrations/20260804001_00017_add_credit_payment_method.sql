-- Add 'Credit' to the payment_method check constraint in payments table

-- Drop the existing check constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

-- Add the updated check constraint with 'Credit' included
ALTER TABLE payments 
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Mobile Money', 'Card', 'Credit', 'E-commerce'));
