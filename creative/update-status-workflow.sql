-- Update database schema to support status workflows for creative module

-- Add status column to prototype_requests if it doesn't exist
ALTER TABLE prototype_requests 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS start_time VARCHAR(50),
ADD COLUMN IF NOT EXISTS end_time VARCHAR(50),
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Modify voice_note_url to TEXT type to handle base64 audio data
ALTER TABLE prototype_requests 
ALTER COLUMN voice_note_url TYPE TEXT;

-- Add status column to idea_hub if it doesn't exist
ALTER TABLE idea_hub 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Add status column to design_bom if it doesn't exist
ALTER TABLE design_bom 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT,
ADD COLUMN IF NOT EXISTS model_3d_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS model_3d_url TEXT,
ADD COLUMN IF NOT EXISTS finishing_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS finishing_url TEXT;

-- Make bom_item and total_price columns nullable if they exist
ALTER TABLE design_bom 
ALTER COLUMN bom_item DROP NOT NULL,
ALTER COLUMN total_price DROP NOT NULL;

-- Add status column to staff_leaves if it doesn't exist
ALTER TABLE staff_leaves 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Add action input columns to resignation_requests
ALTER TABLE resignation_requests 
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Add action input columns to experience_requests
ALTER TABLE experience_requests 
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Add action input columns to transfer_requests
ALTER TABLE transfer_requests 
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Add action input columns to promotion_requests
ALTER TABLE promotion_requests 
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Add action input columns to hire_requests
ALTER TABLE hire_requests 
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Add action input columns to budget_requests
ALTER TABLE budget_requests 
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Add action input columns to other_requests
ALTER TABLE other_requests 
ADD COLUMN IF NOT EXISTS text_message TEXT,
ADD COLUMN IF NOT EXISTS voice_note TEXT,
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS attached_file VARCHAR(255),
ADD COLUMN IF NOT EXISTS attached_file_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prototype_status ON prototype_requests(status);
CREATE INDEX IF NOT EXISTS idx_idea_status ON idea_hub(status);
CREATE INDEX IF NOT EXISTS idx_design_status ON design_bom(status);
CREATE INDEX IF NOT EXISTS idx_leave_status ON staff_leaves(status);

-- Update existing records to have default status
UPDATE prototype_requests SET status = 'Pending' WHERE status IS NULL;
UPDATE idea_hub SET status = 'Pending' WHERE status IS NULL;
UPDATE design_bom SET status = 'Pending' WHERE status IS NULL;
UPDATE staff_leaves SET status = 'Pending' WHERE status IS NULL;

-- Create tables for Request section sub-categories
CREATE TABLE IF NOT EXISTS resignation_requests (
    id BIGSERIAL PRIMARY KEY,
    application_date DATE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    last_working_day DATE NOT NULL,
    reason TEXT NOT NULL,
    notice_period VARCHAR(50) DEFAULT '30 days',
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experience_requests (
    id BIGSERIAL PRIMARY KEY,
    request_date DATE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    employment_start_date DATE NOT NULL,
    employment_end_date DATE NOT NULL,
    purpose VARCHAR(100) DEFAULT 'job application',
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfer_requests (
    id BIGSERIAL PRIMARY KEY,
    request_date DATE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    current_department VARCHAR(255) NOT NULL,
    current_position VARCHAR(255) NOT NULL,
    requested_department VARCHAR(255) NOT NULL,
    requested_position VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    effective_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_requests (
    id BIGSERIAL PRIMARY KEY,
    request_date DATE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    current_position VARCHAR(255) NOT NULL,
    current_salary VARCHAR(50) NOT NULL,
    requested_position VARCHAR(255) NOT NULL,
    requested_salary VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    effective_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hire_requests (
    id BIGSERIAL PRIMARY KEY,
    request_date DATE NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    salary VARCHAR(50) NOT NULL,
    employment_type VARCHAR(50) DEFAULT 'full-time',
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_requests (
    id BIGSERIAL PRIMARY KEY,
    request_date DATE NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    budget_type VARCHAR(50) DEFAULT 'operational',
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    justification TEXT NOT NULL,
    needed_by DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS other_requests (
    id BIGSERIAL PRIMARY KEY,
    request_date DATE NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    request_type VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal',
    needed_by DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for request tables
CREATE INDEX IF NOT EXISTS idx_resignation_status ON resignation_requests(status);
CREATE INDEX IF NOT EXISTS idx_experience_status ON experience_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_status ON transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_promotion_status ON promotion_requests(status);
CREATE INDEX IF NOT EXISTS idx_hire_status ON hire_requests(status);
CREATE INDEX IF NOT EXISTS idx_budget_status ON budget_requests(status);
CREATE INDEX IF NOT EXISTS idx_other_status ON other_requests(status);