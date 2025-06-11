-- Clear existing data and insert updated vehicle data
DELETE FROM Petrotreatment_Vehicles;

-- Reset the sequence for ID
ALTER SEQUENCE petrotreatment_vehicles_id_seq RESTART WITH 1;

-- Insert the updated vehicle data
INSERT INTO Petrotreatment_Vehicles (
    vehicle_type, brand, model, previous_plate_number, current_plate_number, 
    engine_number, chassis_number, license_start, license_end
) VALUES 
('قاطرة', 'مرسيدس', '1979', '12311', '9213 / ط ب ل', '582', '14/454990', NULL, '2022-09-14'),
('قاطرة', 'إفيكو / ماجيـروس', '1982', '11895 352/ل ب د', '6745 / ط ب ر', '9652', 'X40/82/5/11', NULL, '2021-01-04'),
('قاطرة', 'إفيكو صفراء', '2004', '4236 / ط ع ي', '1486 / ص د ص', '52723', '4278472', NULL, '2024-08-20'),
('قاطرة', 'إفيكو بيضاء', '2002', '9986 / ط ع ل', '1645 / ص د ص', '22734', '4247016', NULL, '2024-10-12'),
('مقطورة', 'الرضوى احمر', '2010', '7358 / ط ع ب', '4932 / ص د ل', NULL, '265/2010/30/1', NULL, '2024-11-05'),
('مقطورة', 'كرونا النيل', '2010', NULL, '7362 / ط ع ب', NULL, '2010/600/33/106', NULL, '2021-07-10'),
('مقطورة', 'إباطة فطاطس', '1998', '3916 / ط ع ه', '4857 / ص د ل', NULL, '35/98/1500/249', NULL, '2024-08-30'),
('مقطورة', 'بريما فطاطس', '2009', NULL, '5398 / ط ع ر', NULL, '612/1050/09/70', NULL, '2025-09-01');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON Petrotreatment_Vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON Petrotreatment_Vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_current_plate ON Petrotreatment_Vehicles(current_plate_number);