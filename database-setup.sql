-- Documents table for storing customer documents
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('policy', 'claim', 'payment', 'identification', 'other')),
    url TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);

-- Add some sample data for testing
INSERT INTO documents (customer_id, name, type, url, description) VALUES
(1, 'Auto Insurance Policy 2024', 'policy', '/documents/policy-001.pdf', 'Annual auto insurance policy document'),
(1, 'Driver License Copy', 'identification', '/documents/license-001.jpg', 'Copy of driver license for verification'),
(2, 'Home Insurance Policy 2024', 'policy', '/documents/policy-002.pdf', 'Annual home insurance policy document'),
(2, 'Property Deed', 'identification', '/documents/deed-002.pdf', 'Property ownership document'),
(3, 'Life Insurance Application', 'policy', '/documents/policy-003.pdf', 'Life insurance application form');

-- Add some sample payments for testing
INSERT INTO payments (customer_id, amount, description, due_date, status, payment_url, expires_at) VALUES
(1, 1200.00, 'Auto Insurance Premium - Annual Payment', '2024-12-31', 'active', 'https://pay.insureflow.com/payment/PAY-001', '2024-12-31 23:59:59+00'),
(2, 800.00, 'Home Insurance Premium - Semi-Annual Payment', '2024-11-15', 'active', 'https://pay.insureflow.com/payment/PAY-002', '2024-11-15 23:59:59+00'),
(3, 2400.00, 'Life Insurance Premium - Annual Payment', '2024-10-01', 'paid', 'https://pay.insureflow.com/payment/PAY-003', '2024-10-01 23:59:59+00');

-- Add some sample communications for testing
INSERT INTO communications (type, subject, content, status, scheduled_at) VALUES
('email', 'Policy Renewal Reminder', 'Your auto insurance policy is due for renewal in 30 days. Please contact us to discuss your options.', 'scheduled', '2024-12-01 09:00:00+00'),
('sms', 'Payment Confirmation', 'Thank you for your payment. Your policy is now active.', 'sent', NULL),
('phone', 'Follow-up Call', 'Follow-up call to discuss policy options and answer any questions.', 'scheduled', '2024-11-20 14:00:00+00');

-- Add communication recipients
INSERT INTO communication_recipients (communication_id, customer_id) VALUES
(1, 1),
(2, 2),
(3, 3);
