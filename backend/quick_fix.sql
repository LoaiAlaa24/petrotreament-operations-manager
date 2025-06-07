-- Quick fix: Add the missing created_by column
ALTER TABLE vehicle_receptions ADD COLUMN IF NOT EXISTS created_by INTEGER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_receptions_created_by ON vehicle_receptions(created_by);

-- Show the result
\d vehicle_receptions;