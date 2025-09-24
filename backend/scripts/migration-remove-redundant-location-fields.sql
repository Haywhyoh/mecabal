-- Migration: Remove redundant location fields from users table
-- These fields are now handled through the neighborhoods relationship

-- Step 1: Add a comment to mark these fields as deprecated
COMMENT ON COLUMN users.state IS 'DEPRECATED: Use neighborhoods relationship instead';
COMMENT ON COLUMN users.city IS 'DEPRECATED: Use neighborhoods relationship instead';
COMMENT ON COLUMN users.estate IS 'DEPRECATED: Use neighborhoods relationship instead';

-- Step 2: Create a view for backward compatibility
CREATE OR REPLACE VIEW user_locations AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.state,
    u.city,
    u.estate,
    n.name as neighborhood_name,
    lga.name as lga_name,
    s.name as state_name,
    un.is_primary as is_primary_neighborhood
FROM users u
LEFT JOIN user_neighborhoods un ON u.id = un.user_id AND un.is_primary = true
LEFT JOIN neighborhoods n ON un.neighborhood_id = n.id
LEFT JOIN local_government_areas lga ON n.lga_id = lga.id
LEFT JOIN states s ON lga.state_id = s.id;

-- Step 3: Create a function to get user's primary location
CREATE OR REPLACE FUNCTION get_user_primary_location(user_id UUID)
RETURNS TABLE (
    neighborhood_name TEXT,
    lga_name TEXT,
    state_name TEXT,
    center_latitude DECIMAL,
    center_longitude DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.name,
        lga.name,
        s.name,
        n.center_latitude,
        n.center_longitude
    FROM user_neighborhoods un
    JOIN neighborhoods n ON un.neighborhood_id = n.id
    JOIN local_government_areas lga ON n.lga_id = lga.id
    JOIN states s ON lga.state_id = s.id
    WHERE un.user_id = get_user_primary_location.user_id
    AND un.is_primary = true;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_user_neighborhoods_primary 
ON user_neighborhoods (user_id, is_primary) 
WHERE is_primary = true;
