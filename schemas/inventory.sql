-- Supabase Database Schema for Inventory
-- Based on Component and ComponentDetails types

-- 1. Create Custom Enum Types for better data integrity
CREATE TYPE stock_status AS ENUM ('IN_STOCK', 'LOW', 'OUT');
CREATE TYPE component_category AS ENUM ('MCU', 'Sensor', 'Actuator', 'Logic', 'Power', 'Passive');
CREATE TYPE mount_type AS ENUM ('THROUGH_HOLE', 'SMD');

-- 2. Create the Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    part_number TEXT NOT NULL,
    specs TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    stock stock_status NOT NULL,
    stock_count INTEGER,
    category component_category NOT NULL,
    pins TEXT[] DEFAULT '{}',
    -- details is stored as JSONB to accommodate the various optional fields in ComponentDetails
    -- e.g., voltageMin, voltageMax, logicFamily, pinCount, primaryValue, etc.
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add Indices for optimized searching
CREATE INDEX idx_inventory_name ON inventory (name);
CREATE INDEX idx_inventory_part_number ON inventory (part_number);
CREATE INDEX idx_inventory_category ON inventory (category);

-- 4. Row Level Security (RLS)
-- Enable RLS for the table
-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read the inventory (Public Read)
-- CREATE POLICY "Allow public read access" 
-- ON inventory FOR SELECT 
-- USING (true);

-- Create a policy that allows authenticated users to manage the inventory
-- CREATE POLICY "Allow authenticated users to manage inventory" 
-- ON inventory FOR ALL 
-- TO authenticated 
-- USING (true) 
-- WITH CHECK (true);

-- 5. Trigger to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_modtime
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- 6. Seed data from inventory.json
INSERT INTO inventory (id, name, part_number, specs, unit_price, qty, stock, stock_count, category, pins, details)
VALUES 
('comp_mcu_01', 'Arduino Nano', 'ATMEGA328P-NANO', '5V · 16MHz · 22 GPIO', 516.2, 1, 'IN_STOCK', 150, 'MCU', ARRAY['D0', 'D1', 'D2', '5V', 'GND', 'VIN'], '{"mounting": "THROUGH_HOLE", "package": "DIP-30 Breakout", "voltageMin": 5.0, "voltageMax": 12.0, "ioVoltage": 5.0, "pinCount": 30}'),
('comp_sns_01', 'IR Reflectance Array', 'QTR-8RC', '8-ch · digital · 3-5V', 725.0, 1, 'OUT', 0, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 8-pin", "voltageMin": 3.3, "voltageMax": 5.0, "ioVoltage": 5.0, "pinCount": 11}'),
('comp_act_01', 'Dual Motor Driver', 'TB6612FNG', 'Dual H-bridge · 1.2A', 275.5, 1, 'IN_STOCK', 85, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 16-pin", "voltageMin": 2.5, "voltageMax": 13.5, "logicFamily": "CMOS", "pinCount": 16}'),
('comp_act_02', 'Micro Gear Motor', 'DG01D-E', '6V · 200 RPM · 1:48', 185.6, 2, 'IN_STOCK', 310, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "TT Motor", "voltageMin": 3.0, "voltageMax": 6.0, "nominalVoltage": 6.0, "currentDraw": "250 mA stall"}'),
('comp_pwr_01', 'Li-Ion Battery Pack', '18650-2S', '7.4V · 2600mAh · JST', 823.6, 1, 'IN_STOCK', 55, 'Power', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Battery Pack", "voltageMin": 6.0, "voltageMax": 8.4, "nominalVoltage": 7.4}'),
('comp_log_01', 'Quad NAND Gate', 'SN74HC00N', '2-V to 6-V · 14-DIP', 31.9, 1, 'OUT', 0, 'Logic', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DIP-14", "voltageMin": 2.0, "voltageMax": 6.0, "logicFamily": "74HC", "ioVoltage": 5.0, "pinCount": 14}'),
('comp_act_04', 'Active Piezo Buzzer', 'HYDZ-12V', '12V · 85 dB · 2.3 kHz', 81.2, 1, 'IN_STOCK', 65, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Cylindrical", "voltageMin": 3.0, "voltageMax": 15.0, "nominalVoltage": 12.0, "currentDraw": "30 mA"}'),
('comp_mcu_02', 'ESP32 Dev Module', 'ESP32-WROOM-32D', 'WiFi/BT · 240MHz', 395.0, 1, 'IN_STOCK', 215, 'MCU', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 38-pin", "voltageMin": 3.0, "voltageMax": 3.6, "ioVoltage": 3.3, "pinCount": 38}'),
('comp_sns_02', 'Environmental Sensor', 'BME280', 'Temp/Humidity/Pressure · I2C', 450.0, 1, 'OUT', 0, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 4-pin", "voltageMin": 1.71, "voltageMax": 3.6, "ioVoltage": 3.3, "pinCount": 4}'),
('comp_act_03', '0.96" OLED Display', 'SSD1306-128X64', '128x64 · I2C', 185.0, 1, 'IN_STOCK', 140, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 4-pin", "voltageMin": 3.3, "voltageMax": 5.0, "ioVoltage": 3.3, "pinCount": 4}'),
('comp_pwr_02', 'Lipo Charger Module', 'TP4056', '5V 1A · Micro USB', 35.0, 1, 'IN_STOCK', 500, 'Power', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout", "voltageMin": 4.0, "voltageMax": 8.0, "nominalVoltage": 5.0}'),
('comp_pwr_04', '9V Battery Snap', 'BAT-SNAP-9V', '9V DC · Barrel Jack / Wire', 12.0, 1, 'IN_STOCK', 1500, 'Power', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Connector", "voltageMin": 7.0, "voltageMax": 9.6, "nominalVoltage": 9.0}'),
('comp_sns_03', 'PIR Motion Sensor', 'HC-SR501', 'Adjustable Delay · 3.3V Logic', 65.5, 1, 'IN_STOCK', 320, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 3-pin", "voltageMin": 4.5, "voltageMax": 20.0, "ioVoltage": 3.3, "pinCount": 3}'),
('comp_log_02', '555 Timer IC', 'NE555P', 'Precision Timer', 15.0, 1, 'IN_STOCK', 800, 'Logic', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DIP-8", "voltageMin": 4.5, "voltageMax": 16.0, "logicFamily": "Bipolar", "pinCount": 8}'),
('comp_pas_01', 'Carbon Film Resistor', 'CF1/4W-10K', '10 kΩ · 1/4 W', 2.5, 5, 'IN_STOCK', 5000, 'Passive', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Axial", "voltageMin": 0.0, "voltageMax": 250.0, "primaryValue": "10 kΩ", "powerRating": "1/4 W", "tolerance": "±5%"}'),
('comp_pas_02', 'Electrolytic Capacitor', 'ECA-1EHG101', '100 µF · 25V', 8.0, 2, 'IN_STOCK', 850, 'Passive', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Radial", "voltageMin": 0.0, "voltageMax": 25.0, "primaryValue": "100 µF", "tolerance": "±20%"}'),
('comp_pwr_trans', 'Step-Down Transformer', 'XFMR-12V-2A', '220V to 12V AC · 2A', 350.0, 1, 'IN_STOCK', NULL, 'Power', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Chassis Mount", "voltageMin": 220, "voltageMax": 220, "nominalVoltage": 12}'),
('comp_pwr_rect', 'Bridge Rectifier', 'KBP206', '600V · 2A Bridge', 25.0, 1, 'IN_STOCK', NULL, 'Power', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DIP-4", "voltageMin": 0, "voltageMax": 600, "forwardVoltage": "1.1V"}'),
('comp_log_zener', '12V Zener Diode', '1N4742A', '12V · 1W', 5.5, 1, 'IN_STOCK', NULL, 'Logic', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DO-41", "voltageMin": 0, "voltageMax": 12, "thresholdVoltage": "12V"}'),
('comp_act_led', 'Status LED (Green)', 'LED-5MM-GN', '5mm · Green', 3.0, 1, 'IN_STOCK', NULL, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Radial", "voltageMin": 2.0, "voltageMax": 2.2, "forwardVoltage": "2.1V"}'),
('comp_pwr_03', 'N-Channel Power MOSFET', 'IRFZ44N', '55V · 49A · TO-220', 45.0, 1, 'IN_STOCK', 110, 'Power', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "TO-220", "voltageMin": 0.0, "voltageMax": 55.0, "thresholdVoltage": "4.0 V", "maxCurrent": "49 A", "pinCount": 3}'),
('comp_act_05', '12V SPDT Relay Module', 'SRD-12VDC-SL-C', '10A 250VAC · Optoisolated', 75.0, 1, 'IN_STOCK', 190, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout", "voltageMin": 10.0, "voltageMax": 14.5, "nominalVoltage": 12.0, "contactRating": "10A 250VAC"}'),
('comp_sns_01_alt1', '8-Channel IR Tracking Module', 'TCRT5000-8CH', '8-ch · digital/analog · 3.3-5V', 680.0, 1, 'IN_STOCK', 42, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 10-pin", "voltageMin": 3.3, "voltageMax": 5.0, "ioVoltage": 5.0, "pinCount": 10}'),
('comp_sns_01_alt2', '5-Channel Line Follower Array', 'BFD-1000', '5-ch IR + 1 Limit · 3.3-5V', 420.5, 1, 'IN_STOCK', 88, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 7-pin", "voltageMin": 3.3, "voltageMax": 5.0, "ioVoltage": 5.0, "pinCount": 7}'),
('comp_sns_01_alt3', 'Analog Reflectance Array', 'QTR-8A', '8-ch · analog out · 3.3-5V', 710.0, 1, 'LOW', 5, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 8-pin", "voltageMin": 3.3, "voltageMax": 5.0, "ioVoltage": 5.0, "pinCount": 11}'),
('comp_log_01_alt1', 'Quad NAND Gate (CMOS)', 'CD4011BE', '3-V to 18-V · 14-DIP', 22.04, 1, 'IN_STOCK', 1200, 'Logic', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DIP-14", "voltageMin": 3.0, "voltageMax": 18.0, "logicFamily": "CMOS", "ioVoltage": 5.0, "pinCount": 14}'),
('comp_log_01_alt2', 'Quad NAND Gate (LS TTL)', 'SN74LS00N', '4.75-V to 5.25-V · 14-DIP', 28.5, 1, 'IN_STOCK', 340, 'Logic', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DIP-14", "voltageMin": 4.75, "voltageMax": 5.25, "logicFamily": "LS TTL", "ioVoltage": 5.0, "pinCount": 14}'),
('comp_log_01_alt3', 'Quad NAND Gate (HCT)', 'SN74HCT00N', '4.5-V to 5.5-V · TTL Comp', 34.0, 1, 'IN_STOCK', 210, 'Logic', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DIP-14", "voltageMin": 4.5, "voltageMax": 5.5, "logicFamily": "74HCT", "ioVoltage": 5.0, "pinCount": 14}'),
('comp_sns_02_alt1', 'Environmental Sensor (Gas)', 'BME680', 'Temp/Hum/Press/Gas · I2C', 850.0, 1, 'LOW', 12, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 6-pin", "voltageMin": 1.71, "voltageMax": 3.6, "ioVoltage": 3.3, "pinCount": 6}'),
('comp_sns_02_alt2', 'Pressure/Temp Sensor', 'BMP280', 'Temp/Pressure only · I2C', 210.0, 1, 'IN_STOCK', 145, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 4-pin", "voltageMin": 1.71, "voltageMax": 3.6, "ioVoltage": 3.3, "pinCount": 4}'),
('comp_sns_02_alt3', 'High Precision Temp/Hum', 'SHT31-D', 'Temp/Humidity · I2C', 580.0, 1, 'IN_STOCK', 40, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 4-pin", "voltageMin": 2.15, "voltageMax": 5.5, "ioVoltage": 3.3, "pinCount": 4}'),
('comp_mcu_01_alt1', 'Arduino Pro Mini', 'ATMEGA328P-PRO', '5V · 16MHz · No USB', 320.0, 1, 'IN_STOCK', 200, 'MCU', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DIP-24 Breakout", "voltageMin": 5.0, "voltageMax": 12.0, "ioVoltage": 5.0, "pinCount": 24}'),
('comp_mcu_01_alt2', 'Arduino Uno R3 (SMD)', 'UNO-R3-SMD', '5V · 16MHz · 20 GPIO', 580.0, 1, 'IN_STOCK', 95, 'MCU', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Dev Board", "voltageMin": 7.0, "voltageMax": 12.0, "ioVoltage": 5.0, "pinCount": 32}'),
('comp_mcu_01_alt3', 'LGT8F328P Mini', 'LGT8F328P', 'Nano Clone · 32MHz', 210.5, 1, 'IN_STOCK', 400, 'MCU', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "DIP-30 Breakout", "voltageMin": 5.0, "voltageMax": 12.0, "ioVoltage": 5.0, "pinCount": 30}'),
('comp_mcu_02_alt1', 'ESP8266 NodeMCU', 'ESP-12E-NODE', 'WiFi only · 80MHz', 245.0, 1, 'IN_STOCK', 300, 'MCU', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 30-pin", "voltageMin": 3.0, "voltageMax": 3.6, "ioVoltage": 3.3, "pinCount": 30}'),
('comp_mcu_02_alt2', 'ESP32-S2 Mini', 'ESP32-S2-WROVER', 'WiFi · USB OTG', 320.0, 1, 'IN_STOCK', 150, 'MCU', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 32-pin", "voltageMin": 3.0, "voltageMax": 3.6, "ioVoltage": 3.3, "pinCount": 32}'),
('comp_mcu_02_alt3', 'ESP32-C3 SuperMini', 'ESP32-C3', 'RISC-V · WiFi/BLE 5', 280.0, 1, 'IN_STOCK', 85, 'MCU', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 16-pin", "voltageMin": 3.0, "voltageMax": 3.6, "ioVoltage": 3.3, "pinCount": 16}'),
('comp_act_01_alt1', 'L298N Motor Driver', 'L298N-MOD', 'Dual H-bridge · 2A', 150.0, 1, 'IN_STOCK', 400, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Module Board", "voltageMin": 5.0, "voltageMax": 35.0, "logicFamily": "TTL", "pinCount": 6}'),
('comp_act_01_alt2', 'DRV8833 Motor Driver', 'DRV8833', 'Dual H-bridge · 1.5A', 210.0, 1, 'IN_STOCK', 120, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 12-pin", "voltageMin": 2.7, "voltageMax": 10.8, "logicFamily": "CMOS", "pinCount": 12}'),
('comp_act_01_alt3', 'MX1508 Motor Driver', 'MX1508', 'Dual H-bridge · 1.5A Mini', 85.0, 1, 'IN_STOCK', 600, 'Actuator', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 10-pin", "voltageMin": 2.0, "voltageMax": 9.6, "logicFamily": "CMOS", "pinCount": 10}'),
('comp_sns_03_alt1', 'Mini PIR Sensor', 'AM312', 'Fixed Delay · 3.3V Logic', 95.0, 1, 'IN_STOCK', 210, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 3-pin", "voltageMin": 2.7, "voltageMax": 12.0, "ioVoltage": 3.3, "pinCount": 3}'),
('comp_sns_03_alt2', 'Microwave Radar Sensor', 'RCWL-0516', 'Doppler Radar · 3.3V out', 110.0, 1, 'IN_STOCK', 185, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 5-pin", "voltageMin": 4.0, "voltageMax": 28.0, "ioVoltage": 3.3, "pinCount": 5}'),
('comp_sns_03_alt3', 'Digital PIR Motion Sensor', 'AS312', 'Low Power PIR · 3.3V', 135.0, 1, 'LOW', 14, 'Sensor', ARRAY[]::TEXT[], '{"mounting": "THROUGH_HOLE", "package": "Breakout 3-pin", "voltageMin": 2.7, "voltageMax": 3.3, "ioVoltage": 3.3, "pinCount": 3}');
