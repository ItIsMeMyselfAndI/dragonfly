-- 1. Create the inventory_item_details Table
CREATE TABLE IF NOT EXISTS inventory_item_details (
    inventory_id TEXT PRIMARY KEY REFERENCES inventory(id) ON DELETE CASCADE,
    -- Universal
    mounting TEXT,
    package TEXT,
    voltage_min NUMERIC,
    voltage_max NUMERIC,
    -- Passive
    primary_value TEXT,
    power_rating TEXT,
    tolerance TEXT,
    -- Semiconductor
    forward_voltage TEXT,
    max_current TEXT,
    threshold_voltage TEXT,
    -- IC
    logic_family TEXT,
    io_voltage NUMERIC,
    pin_count INTEGER,
    -- Electromechanical
    nominal_voltage NUMERIC,
    current_draw TEXT,
    contact_rating TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Index
CREATE INDEX idx_item_details_inventory_id ON inventory_item_details(inventory_id);

-- 3. Row Level Security (RLS)
-- ALTER TABLE inventory_item_details ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Allow public read access" 
-- ON inventory_item_details FOR SELECT 
-- USING (true);
--
-- CREATE POLICY "Allow authenticated users to manage item details" 
-- ON inventory_item_details FOR ALL 
-- TO authenticated 
-- USING (true) 
-- WITH CHECK (true);

-- 4. Trigger to automatically update 'updated_at' timestamp
CREATE TRIGGER update_inventory_item_details_modtime
    BEFORE UPDATE ON inventory_item_details
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- 5. Data Migration (Optional: populate from jsonb details in inventory)
INSERT INTO inventory_item_details (
    inventory_id,
    mounting,
    package,
    voltage_min,
    voltage_max,
    primary_value,
    power_rating,
    tolerance,
    forward_voltage,
    max_current,
    threshold_voltage,
    logic_family,
    io_voltage,
    pin_count,
    nominal_voltage,
    current_draw,
    contact_rating
)
SELECT 
    id,
    (details->>'mounting')::TEXT,
    (details->>'package')::TEXT,
    (details->>'voltageMin')::NUMERIC,
    (details->>'voltageMax')::NUMERIC,
    (details->>'primaryValue')::TEXT,
    (details->>'powerRating')::TEXT,
    (details->>'tolerance')::TEXT,
    (details->>'forwardVoltage')::TEXT,
    (details->>'maxCurrent')::TEXT,
    (details->>'thresholdVoltage')::TEXT,
    (details->>'logicFamily')::TEXT,
    (details->>'ioVoltage')::NUMERIC,
    (details->>'pinCount')::INTEGER,
    (details->>'nominalVoltage')::NUMERIC,
    (details->>'currentDraw')::TEXT,
    (details->>'contactRating')::TEXT
FROM inventory 
WHERE details IS NOT NULL AND details != '{}'::jsonb;
