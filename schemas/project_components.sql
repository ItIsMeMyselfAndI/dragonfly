-- Supabase Database Schema for Project Components (BOM Items)
-- Tracks the specific components used in a project, their quantity, and the unit price at the time of addition.

CREATE TABLE IF NOT EXISTS project_components (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    inventory_id TEXT NOT NULL REFERENCES inventory(id),
    name TEXT NOT NULL,
    part_number TEXT NOT NULL,
    specs TEXT NOT NULL,
    unit_price NUMERIC NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    category TEXT NOT NULL,
    pins JSONB NOT NULL DEFAULT '[]',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_project_components_project_id ON project_components(project_id);

-- Seed Data (Simplified for this example)
INSERT INTO project_components (id, project_id, inventory_id, name, part_number, specs, unit_price, qty, category, pins) VALUES
('pc_01', 'proj_01', 'comp_pwr_01', 'Li-Ion Battery Pack', '18650-2S', '7.4V · 2600mAh · JST', 823.6, 1, 'Power', '[]'),
('pc_02', 'proj_01', 'comp_mcu_01', 'Arduino Nano', 'ATMEGA328P-NANO', '5V · 16MHz · 22 GPIO', 516.2, 1, 'MCU', '["D0", "D1", "D2", "5V", "GND", "VIN"]'),
('pc_03', 'proj_01', 'comp_sns_01', 'IR Reflectance Array', 'QTR-8RC', '8-ch · digital · 3-5V', 725.0, 1, 'Sensor', '[]'),
('pc_04', 'proj_01', 'comp_act_01', 'Dual Motor Driver', 'TB6612FNG', 'Dual H-bridge · 1.2A', 275.5, 1, 'Actuator', '[]'),
('pc_05', 'proj_01', 'comp_log_01', 'Quad NAND Gate', 'SN74HC00N', '2-V to 6-V · 14-DIP', 31.9, 1, 'Logic', '[]'),
('pc_06', 'proj_01', 'comp_act_02', 'Micro Gear Motor', 'DG01D-E', '6V · 200 RPM · 1:48', 185.6, 1, 'Actuator', '[]'),
('pc_07', 'proj_01', 'comp_act_04', 'Active Piezo Buzzer', 'HYDZ-12V', '12V · 85 dB · 2.3 kHz', 81.2, 1, 'Actuator', '[]'),
('pc_08', 'proj_02', 'comp_pwr_02', 'Lipo Charger Module', 'TP4056', '5V 1A · Micro USB', 35.0, 1, 'Power', '[]'),
('pc_09', 'proj_02', 'comp_sns_02', 'Environmental Sensor', 'BME280', 'Temp/Humidity/Pressure · I2C', 450.0, 1, 'Sensor', '[]'),
('pc_10', 'proj_02', 'comp_mcu_02', 'ESP32 Dev Module', 'ESP32-WROOM-32D', 'WiFi/BT · 240MHz', 395.0, 1, 'MCU', '[]'),
('pc_11', 'proj_02', 'comp_act_03', '0.96" OLED Display', 'SSD1306-128X64', '128x64 · I2C', 185.0, 1, 'Actuator', '[]'),
('pc_12', 'proj_03', 'comp_pwr_04', '9V Battery Snap', 'BAT-SNAP-9V', '9V DC · Barrel Jack / Wire', 12.0, 1, 'Power', '[]'),
('pc_13', 'proj_03', 'comp_sns_03', 'PIR Motion Sensor', 'HC-SR501', 'Adjustable Delay · 3.3V Logic', 65.5, 1, 'Sensor', '[]'),
('pc_14', 'proj_03', 'comp_pas_01', 'Carbon Film Resistor', 'CF1/4W-10K', '10 kΩ · 1/4 W', 2.5, 1, 'Passive', '[]'),
('pc_15', 'proj_03', 'comp_pas_02', 'Electrolytic Capacitor', 'ECA-1EHG101', '100 µF · 25V', 8.0, 1, 'Passive', '[]'),
('pc_16', 'proj_03', 'comp_log_02', '555 Timer IC', 'NE555P', 'Precision Timer', 15.0, 1, 'Logic', '[]'),
('pc_17', 'proj_03', 'comp_act_04', 'Active Piezo Buzzer', 'HYDZ-12V', '12V · 85 dB · 2.3 kHz', 81.2, 1, 'Actuator', '[]'),
('pc_18', 'proj_04', 'comp_pwr_trans', 'Step-Down Transformer', 'XFMR-12V-2A', '220V to 12V AC · 2A', 350.0, 1, 'Power', '[]'),
('pc_19', 'proj_04', 'comp_pwr_rect', 'Bridge Rectifier', 'KBP206', '600V · 2A Bridge', 25.0, 1, 'Power', '[]'),
('pc_20', 'proj_04', 'comp_pwr_03', 'N-Channel Power MOSFET', 'IRFZ44N', '55V · 49A · TO-220', 45.0, 1, 'Power', '[]'),
('pc_21', 'proj_04', 'comp_act_05', '12V SPDT Relay Module', 'SRD-12VDC-SL-C', '10A 250VAC · Optoisolated', 75.0, 1, 'Actuator', '[]'),
('pc_22', 'proj_04', 'comp_log_zener', '12V Zener Diode', '1N4742A', '12V · 1W', 5.5, 1, 'Logic', '[]'),
('pc_23', 'proj_04', 'comp_act_led', 'Status LED (Green)', 'LED-5MM-GN', '5mm · Green', 3.0, 1, 'Actuator', '[]')
ON CONFLICT (id) DO NOTHING;
