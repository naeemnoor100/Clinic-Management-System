<?php
/**
 * SmartClinic - Secure Sync Bridge
 * Upload this file to your hosting to enable cross-device synchronization.
 */

// Allow cross-origin requests from your app domain
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Sync-Code, X-Action-Type");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the sync code from headers
$headers = getallheaders();
$syncCode = isset($headers['X-Sync-Code']) ? preg_replace('/[^A-Z0-9-]/', '', $headers['X-Sync-Code']) : null;
$actionType = isset($headers['X-Action-Type']) ? $headers['X-Action-Type'] : 'backup';

if (!$syncCode) {
    echo json_encode(["status" => "error", "message" => "Missing Clinic Sync Code header."]);
    exit;
}

// Storage Directory
$storageDir = __DIR__ . "/data_backups/";
if (!file_exists($storageDir)) {
    mkdir($storageDir, 0755, true);
}

$filePath = $storageDir . $syncCode . ".json";

// Read Input
$input = file_get_contents("php://input");
$decoded = json_decode($input, true);

if ($actionType === 'backup') {
    // Save data
    if (isset($decoded['data'])) {
        $saveData = json_encode($decoded['data'], JSON_PRETTY_PRINT);
        if (file_put_contents($filePath, $saveData)) {
            echo json_encode(["status" => "success", "message" => "Backup saved successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to write data to disk."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "No data provided."]);
    }
} else if ($actionType === 'restore') {
    // Retrieve data
    if (file_exists($filePath)) {
        $data = file_get_contents($filePath);
        echo json_encode(["status" => "success", "data" => json_decode($data)]);
    } else {
        echo json_encode(["status" => "error", "message" => "No record found for sync code: $syncCode"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid action type."]);
}
?>