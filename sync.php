<?php
/**
 * SmartClinic - MySQL Sync Bridge
 * Upload this file along with config.php to your hosting.
 */

require_once 'config.php';

// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Sync-Code, X-Action-Type");
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    $pdo->exec("set names utf8mb4");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed: " . $e->getMessage()]);
    exit;
}

// Get Headers
$headers = function_exists('getallheaders') ? getallheaders() : [];
$headers = array_change_key_case($headers, CASE_LOWER);

// Read Input
$input = file_get_contents("php://input");
$decoded = json_decode($input, true);

// Determine Action Type
$actionType = 'backup'; // Default

if (isset($headers['x-action-type'])) {
    $actionType = $headers['x-action-type'];
} else if (isset($decoded['action'])) {
    $actionType = $decoded['action'];
}

// Default to Clinic ID 1 (Single Tenant Mode)
$clinicId = 1;

// Helper function to insert/update
function camelToSnake($input) {
    return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
}

function snakeToCamel($input) {
    return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $input))));
}

function mapRowToCamel($row, $mapping = []) {
    $newRow = [];
    foreach ($row as $key => $value) {
        // Reverse mapping if exists (value -> key)
        $mappedKey = array_search($key, $mapping);
        if ($mappedKey !== false) {
            $newRow[$mappedKey] = $value;
        } else {
            $newRow[snakeToCamel($key)] = $value;
        }
    }
    return $newRow;
}

function processSync($pdo, $table, $items, $clinicId, $mapping = []) {
    // Upsert the payload items
    if (empty($items)) return;
    
    // Get columns for the table to avoid inserting unknown columns
    $stmt = $pdo->prepare("DESCRIBE `$table` ");
    $stmt->execute();
    $tableColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($items as $item) {
        $dbData = ['clinic_id' => $clinicId];
        foreach ($item as $key => $value) {
            $dbKey = isset($mapping[$key]) ? $mapping[$key] : camelToSnake($key);
            
            // Skip if column doesn't exist in table
            if (!in_array($dbKey, $tableColumns)) continue;

            if (is_array($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE); // Handle JSON fields like vitals
            }
            $dbData[$dbKey] = $value;
        }
        
        // Ensure we have data to insert (besides clinic_id)
        if (count($dbData) <= 1) continue;

        $columns = array_keys($dbData);
        $placeholders = array_fill(0, count($columns), '?');
        $updates = [];
        foreach ($columns as $col) {
            if ($col !== 'id' && $col !== 'clinic_id') {
                $updates[] = "`$col` = VALUES(`$col`)";
            }
        }
        
        $sql = "INSERT INTO `$table` (" . implode(', ', array_map(function($c){return "`$c`";}, $columns)) . ") VALUES (" . implode(', ', $placeholders) . ") 
                ON DUPLICATE KEY UPDATE " . implode(', ', $updates);
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($dbData));
    }
}

// Mappings (JSON key -> DB column)
$patientMap = ['patientCode' => 'patient_code', 'chronicConditions' => 'chronic_conditions'];
$medMap = ['brandName' => 'brand_name', 'scientificName' => 'scientific_name', 'companyName' => 'company_name', 'pricePerUnit' => 'price_per_unit', 'reorderLevel' => 'reorder_level'];
$visitMap = ['patientId' => 'patient_id', 'feeAmount' => 'fee_amount', 'paymentStatus' => 'payment_status'];
$saleMap = ['customerName' => 'customer_name', 'totalAmount' => 'total_amount', 'paymentStatus' => 'payment_status'];
$templateMap = ['minAge' => 'min_age', 'maxAge' => 'max_age'];
$vitalDefMap = []; // label->label, unit->unit

if ($actionType === 'backup') {
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid JSON: " . json_last_error_msg()]);
        exit;
    }

    $data = $decoded['data'] ?? null;

    if (!$data) {
        echo json_encode(["status" => "error", "message" => "No data provided."]);
        exit;
    }

    $pdo->beginTransaction();
    try {
        // 0. Process Explicit Deletions
        $deletedItems = $decoded['deletedIds'] ?? [];
        if (!empty($deletedItems)) {
            foreach ($deletedItems as $del) {
                if (!isset($del['id']) || !isset($del['type'])) continue;
                
                $id = $del['id'];
                $type = $del['type'];
                $table = '';
                
                switch ($type) {
                    case 'patients': $table = 'patients'; break;
                    case 'medications': $table = 'medications'; break;
                    case 'visits': $table = 'visits'; break;
                    case 'pharmacySales': $table = 'pharmacy_sales'; break;
                    case 'scientific': $table = 'scientific_names'; break;
                    case 'companies': $table = 'company_names'; break;
                    case 'med_types': $table = 'med_types'; break;
                    case 'med_categories': $table = 'med_categories'; break;
                    case 'symptoms': $table = 'symptoms'; break;
                    case 'vitals': $table = 'vital_definitions'; break;
                    case 'templates': $table = 'prescription_templates'; break;
                    case 'low_stock': $table = 'medications'; break;
                }
                
                if ($table) {
                    $stmt = $pdo->prepare("DELETE FROM `$table` WHERE `id` = ? AND `clinic_id` = ?");
                    $stmt->execute([$id, $clinicId]);
                }
            }
        }

        // 1. Patients
        processSync($pdo, 'patients', $data['patients'] ?? [], $clinicId, $patientMap);
        
        // 2. Medications
        processSync($pdo, 'medications', $data['medications'] ?? [], $clinicId, $medMap);
        
        // 3. Visits & Visit Meds
        // First sync visits table
        processSync($pdo, 'visits', $data['visits'] ?? [], $clinicId, $visitMap);
        
        // Then handle visit_medications (Child table)
        // Safer approach: Delete meds only for the visits being synced, then re-insert.
        if (!empty($data['visits'])) {
            $vmDeleteStmt = $pdo->prepare("DELETE FROM `visit_medications` WHERE `visit_id` = ? AND `clinic_id` = ?");
            $vmInsertStmt = $pdo->prepare("INSERT INTO `visit_medications` (`visit_id`, `clinic_id`, `medication_id`, `custom_name`, `dosage`, `frequency`, `duration`, `quantity`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            foreach ($data['visits'] as $visit) {
                // Delete existing meds for this visit
                $vmDeleteStmt->execute([$visit['id'], $clinicId]);
                
                if (!empty($visit['prescribedMeds'])) {
                    foreach ($visit['prescribedMeds'] as $pm) {
                        $vmInsertStmt->execute([
                            $visit['id'],
                            $clinicId,
                            $pm['medicationId'],
                            $pm['customName'] ?? null,
                            $pm['dosage'],
                            $pm['frequency'],
                            $pm['duration'],
                            $pm['quantity'] ?? 0
                        ]);
                    }
                }
            }
        }

        // 4. Pharmacy Sales
        processSync($pdo, 'pharmacy_sales', $data['pharmacySales'] ?? [], $clinicId, $saleMap);
        
        // Handle pharmacy_sale_items
        if (!empty($data['pharmacySales'])) {
            $siDeleteStmt = $pdo->prepare("DELETE FROM `pharmacy_sale_items` WHERE `sale_id` = ? AND `clinic_id` = ?");
            $siInsertStmt = $pdo->prepare("INSERT INTO `pharmacy_sale_items` (`sale_id`, `clinic_id`, `medication_id`, `quantity`, `price_at_time`) VALUES (?, ?, ?, ?, ?)");
            
            foreach ($data['pharmacySales'] as $sale) {
                // Delete existing items for this sale
                $siDeleteStmt->execute([$sale['id'], $clinicId]);
                
                if (!empty($sale['items'])) {
                    foreach ($sale['items'] as $item) {
                        $siInsertStmt->execute([
                            $sale['id'],
                            $clinicId,
                            $item['medicationId'],
                            $item['quantity'],
                            $item['priceAtTime']
                        ]);
                    }
                }
            }
        }

        // 5. Other Tables
        processSync($pdo, 'scientific_names', $data['scientificNames'] ?? [], $clinicId);
        processSync($pdo, 'company_names', $data['companyNames'] ?? [], $clinicId);
        processSync($pdo, 'med_types', $data['medTypes'] ?? [], $clinicId);
        processSync($pdo, 'med_categories', $data['medCategories'] ?? [], $clinicId);
        processSync($pdo, 'symptoms', $data['symptoms'] ?? [], $clinicId);
        processSync($pdo, 'vital_definitions', $data['vitalDefinitions'] ?? [], $clinicId);

        // 6. Templates
        processSync($pdo, 'prescription_templates', $data['prescriptionTemplates'] ?? [], $clinicId, $templateMap);
        
        // Handle template_meds
        if (!empty($data['prescriptionTemplates'])) {
            $tmDeleteStmt = $pdo->prepare("DELETE FROM `template_meds` WHERE `template_id` = ? AND `clinic_id` = ?");
            $tmInsertStmt = $pdo->prepare("INSERT INTO `template_meds` (`template_id`, `clinic_id`, `medication_id`, `custom_name`, `dosage`, `frequency`, `duration`, `quantity`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            foreach ($data['prescriptionTemplates'] as $tpl) {
                // Delete existing meds for this template
                $tmDeleteStmt->execute([$tpl['id'], $clinicId]);
                
                if (!empty($tpl['prescribedMeds'])) {
                    foreach ($tpl['prescribedMeds'] as $pm) {
                        $tmInsertStmt->execute([
                            $tpl['id'],
                            $clinicId,
                            $pm['medicationId'],
                            $pm['customName'] ?? null,
                            $pm['dosage'],
                            $pm['frequency'],
                            $pm['duration'],
                            $pm['quantity'] ?? 0
                        ]);
                    }
                }
            }
        }

        // 7. Settings (Patient Counter)
        if (isset($data['patientCounter'])) {
            $stmt = $pdo->prepare("INSERT INTO `clinic_settings` (`clinic_id`, `patient_counter`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `patient_counter` = VALUES(`patient_counter`)");
            $stmt->execute([$clinicId, $data['patientCounter']]);
        }

        // Update Last Sync Timestamp
        $stmt = $pdo->prepare("INSERT INTO `clinic_settings` (`clinic_id`, `last_updated`) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE `last_updated` = NOW()");
        $stmt->execute([$clinicId]);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Backup synced to MySQL successfully."]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    }

} else if ($actionType === 'poll') {
    // Long Polling Logic
    $clientTimestamp = isset($decoded['timestamp']) ? strtotime($decoded['timestamp']) : 0;
    
    $startTime = time();
    $timeout = 25; // 25 seconds timeout
    
    // Ensure clinic_settings has last_updated column
    try {
        $pdo->exec("ALTER TABLE `clinic_settings` ADD COLUMN `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    } catch (Exception $e) {
        // Ignore if column exists
    }

    while (time() - $startTime < $timeout) {
        $stmt = $pdo->prepare("SELECT `last_updated` FROM `clinic_settings` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $lastUpdated = $stmt->fetchColumn();
        
        if ($lastUpdated && strtotime($lastUpdated) > $clientTimestamp) {
            echo json_encode(["status" => "update_available", "timestamp" => $lastUpdated]);
            exit;
        }
        
        usleep(500000); // Sleep 0.5s
        
        // Reset connection to prevent timeout? No, just keep checking.
    }
    
    echo json_encode(["status" => "no_change"]);
    exit;

} else if ($actionType === 'install') {
    // Automatic Database Setup
    try {
        // Set connection to utf8mb4
        $pdo->exec("SET NAMES utf8mb4");
        
        // Try to set database charset
        try {
            $pdo->exec("ALTER DATABASE `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (Exception $e) {
            // Ignore if not allowed
        }

        $tables = [
            "clinics" => "CREATE TABLE IF NOT EXISTS `clinics` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50),
                password_hash VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "patients" => "CREATE TABLE IF NOT EXISTS `patients` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                patient_code VARCHAR(50),
                name VARCHAR(255),
                age INT,
                gender VARCHAR(50),
                phone VARCHAR(50),
                address TEXT,
                allergies TEXT,
                chronic_conditions TEXT,
                notes TEXT,
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "medications" => "CREATE TABLE IF NOT EXISTS `medications` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                brand_name VARCHAR(255),
                scientific_name VARCHAR(255),
                company_name VARCHAR(255),
                type VARCHAR(100),
                unit VARCHAR(100),
                strength VARCHAR(100),
                category VARCHAR(100),
                stock INT,
                reorder_level INT,
                price_per_unit DECIMAL(10, 2),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "visits" => "CREATE TABLE IF NOT EXISTS `visits` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                patient_id VARCHAR(50),
                date DATE,
                symptoms TEXT,
                diagnosis TEXT,
                vitals TEXT,
                fee_amount DECIMAL(10, 2),
                payment_status VARCHAR(50),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "visit_medications" => "CREATE TABLE IF NOT EXISTS `visit_medications` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                visit_id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                medication_id VARCHAR(50),
                custom_name VARCHAR(255),
                dosage VARCHAR(100),
                frequency VARCHAR(100),
                duration VARCHAR(100),
                quantity INT,
                FOREIGN KEY (visit_id, clinic_id) REFERENCES `visits`(id, clinic_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "pharmacy_sales" => "CREATE TABLE IF NOT EXISTS `pharmacy_sales` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                customer_name VARCHAR(255),
                date DATE,
                total_amount DECIMAL(10, 2),
                payment_status VARCHAR(50),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "pharmacy_sale_items" => "CREATE TABLE IF NOT EXISTS `pharmacy_sale_items` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                medication_id VARCHAR(50),
                quantity INT,
                price_at_time DECIMAL(10, 2),
                FOREIGN KEY (sale_id, clinic_id) REFERENCES `pharmacy_sales`(id, clinic_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "scientific_names" => "CREATE TABLE IF NOT EXISTS `scientific_names` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                label VARCHAR(255),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "company_names" => "CREATE TABLE IF NOT EXISTS `company_names` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                label VARCHAR(255),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "med_types" => "CREATE TABLE IF NOT EXISTS `med_types` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                label VARCHAR(255),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "med_categories" => "CREATE TABLE IF NOT EXISTS `med_categories` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                label VARCHAR(255),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "symptoms" => "CREATE TABLE IF NOT EXISTS `symptoms` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                label VARCHAR(255),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "vital_definitions" => "CREATE TABLE IF NOT EXISTS `vital_definitions` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                label VARCHAR(255),
                unit VARCHAR(50),
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "prescription_templates" => "CREATE TABLE IF NOT EXISTS `prescription_templates` (
                id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                name VARCHAR(255),
                diagnosis VARCHAR(255),
                min_age INT,
                max_age INT,
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "template_meds" => "CREATE TABLE IF NOT EXISTS `template_meds` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                template_id VARCHAR(50) NOT NULL,
                clinic_id INT NOT NULL,
                medication_id VARCHAR(50),
                custom_name VARCHAR(255),
                dosage VARCHAR(100),
                frequency VARCHAR(100),
                duration VARCHAR(100),
                quantity INT,
                FOREIGN KEY (template_id, clinic_id) REFERENCES `prescription_templates`(id, clinic_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "clinic_settings" => "CREATE TABLE IF NOT EXISTS `clinic_settings` (
                clinic_id INT PRIMARY KEY,
                patient_counter INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (clinic_id) REFERENCES `clinics`(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        ];

        foreach ($tables as $tableName => $query) {
            $pdo->exec($query);
            // Also convert existing tables to utf8mb4 just in case they were created with latin1
            try {
                $pdo->exec("ALTER TABLE `$tableName` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            } catch (Exception $e) {
                // Ignore if conversion fails
            }
        }

        // Insert default clinic if not exists
        $pdo->exec("INSERT INTO `clinics` (id, username, password_hash) 
                    SELECT 1, 'default_clinic', 'no_password' 
                    WHERE NOT EXISTS (SELECT * FROM `clinics` WHERE id = 1)");

        echo json_encode(["status" => "success", "message" => "Database tables created and updated for Urdu support successfully."]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Setup Error: " . $e->getMessage()]);
    }

} else if ($actionType === 'restore') {
    
    try {
        $response = [];

        // 1. Fetch Patients
        $stmt = $pdo->prepare("SELECT * FROM `patients` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response['patients'] = array_map(function($row) use ($patientMap) {
            $row = mapRowToCamel($row, $patientMap);
            // allergies and chronicConditions are strings, do not json_decode them
            return $row;
        }, $patients);

        // 2. Fetch Medications
        $stmt = $pdo->prepare("SELECT * FROM `medications` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $meds = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response['medications'] = array_map(function($row) use ($medMap) {
            return mapRowToCamel($row, $medMap);
        }, $meds);

        // 3. Fetch Visits
        $stmt = $pdo->prepare("SELECT * FROM `visits` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fetch Visit Meds
        $stmt = $pdo->prepare("SELECT * FROM `visit_medications` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $allVisitMeds = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group meds by visit_id
        $visitMedsGrouped = [];
        foreach ($allVisitMeds as $vm) {
            $vid = $vm['visit_id'];
            if (!isset($visitMedsGrouped[$vid])) $visitMedsGrouped[$vid] = [];
            $vmCamel = mapRowToCamel($vm);
            $vmCamel['medicationId'] = $vm['medication_id']; // Ensure correct mapping
            $visitMedsGrouped[$vid][] = $vmCamel;
        }

        foreach ($visits as &$v) {
            $v = mapRowToCamel($v, $visitMap);
            if (isset($v['vitals'])) {
                $decoded = json_decode($v['vitals'], true);
                $v['vitals'] = (is_array($decoded) && !empty($decoded)) ? $decoded : (object)[];
            }
            // symptoms and diagnosis are strings, do not json_decode them
            $v['prescribedMeds'] = isset($visitMedsGrouped[$v['id']]) ? $visitMedsGrouped[$v['id']] : [];
        }
        $response['visits'] = $visits;

        // 4. Fetch Pharmacy Sales
        $stmt = $pdo->prepare("SELECT * FROM `pharmacy_sales` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fetch Sale Items
        $stmt = $pdo->prepare("SELECT * FROM `pharmacy_sale_items` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $allSaleItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $saleItemsGrouped = [];
        foreach ($allSaleItems as $si) {
            $sid = $si['sale_id'];
            if (!isset($saleItemsGrouped[$sid])) $saleItemsGrouped[$sid] = [];
            $siCamel = mapRowToCamel($si);
            $siCamel['medicationId'] = $si['medication_id'];
            $siCamel['priceAtTime'] = $si['price_at_time'];
            $saleItemsGrouped[$sid][] = $siCamel;
        }
        
        foreach ($sales as &$s) {
            $s = mapRowToCamel($s, $saleMap);
            $s['items'] = isset($saleItemsGrouped[$s['id']]) ? $saleItemsGrouped[$s['id']] : [];
        }
        $response['pharmacySales'] = $sales;

        // 5. Fetch Other Tables
        $tables = [
            'scientificNames' => 'scientific_names',
            'companyNames' => 'company_names',
            'medTypes' => 'med_types',
            'medCategories' => 'med_categories',
            'symptoms' => 'symptoms',
            'vitalDefinitions' => 'vital_definitions'
        ];
        
        foreach ($tables as $key => $table) {
            $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE `clinic_id` = ?");
            $stmt->execute([$clinicId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response[$key] = array_map(function($row) { return mapRowToCamel($row); }, $rows);
        }

        // 6. Fetch Templates
        $stmt = $pdo->prepare("SELECT * FROM `prescription_templates` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fetch Template Meds
        $stmt = $pdo->prepare("SELECT * FROM `template_meds` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $allTemplateMeds = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $tplMedsGrouped = [];
        foreach ($allTemplateMeds as $tm) {
            $tid = $tm['template_id'];
            if (!isset($tplMedsGrouped[$tid])) $tplMedsGrouped[$tid] = [];
            $tmCamel = mapRowToCamel($tm);
            $tmCamel['medicationId'] = $tm['medication_id'];
            $tplMedsGrouped[$tid][] = $tmCamel;
        }
        
        foreach ($templates as &$t) {
            $t = mapRowToCamel($t, $templateMap);
            $t['prescribedMeds'] = isset($tplMedsGrouped[$t['id']]) ? $tplMedsGrouped[$t['id']] : [];
        }
        $response['prescriptionTemplates'] = $templates;

        // Fetch Settings
        $stmt = $pdo->prepare("SELECT `patient_counter` FROM `clinic_settings` WHERE `clinic_id` = ?");
        $stmt->execute([$clinicId]);
        $response['patientCounter'] = $stmt->fetchColumn() ?: 0;

        $json = json_encode(["status" => "success", "data" => $response], JSON_UNESCAPED_UNICODE);
        
        if ($json === false) {
             throw new Exception("JSON Encode Error: " . json_last_error_msg());
        }
        
        echo $json;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid action type."]);
}
?>
