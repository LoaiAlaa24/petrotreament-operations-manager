-- Database migration for role-based access control
-- Add created_by column to track record ownership

-- Check if column exists and add it if not
DO $$
BEGIN
    -- Add created_by column to vehicle_receptions table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='vehicle_receptions' AND column_name='created_by'
    ) THEN
        ALTER TABLE vehicle_receptions ADD COLUMN created_by INTEGER;
        RAISE NOTICE 'Added created_by column to vehicle_receptions table';
    ELSE
        RAISE NOTICE 'created_by column already exists in vehicle_receptions table';
    END IF;
    
    -- Create index for better performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename='vehicle_receptions' AND indexname='idx_vehicle_receptions_created_by'
    ) THEN
        CREATE INDEX idx_vehicle_receptions_created_by ON vehicle_receptions(created_by);
        RAISE NOTICE 'Created index on vehicle_receptions.created_by';
    ELSE
        RAISE NOTICE 'Index on vehicle_receptions.created_by already exists';
    END IF;
END $$;

-- Update any users with invalid roles
UPDATE users 
SET role = 'admin' 
WHERE role NOT IN ('super_admin', 'admin');

-- Display role summary
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;