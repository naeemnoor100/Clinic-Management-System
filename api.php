<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS, GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if ($action === 'signup') {
    $stmt = $pdo->query("SELECT COUNT(*) FROM clinics");
    $userCount = $stmt->fetchColumn();
    $role = ($userCount == 0) ? 'admin' : 'user';

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO clinics (username, password_hash, role) VALUES (?, ?, ?)");
    try {
        $stmt->execute([$username, $hash, $role]);
        echo json_encode(["status" => "success", "user" => ["id" => $pdo->lastInsertId(), "username" => $username, "role" => $role]]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Username already exists"]);
    }
} elseif ($action === 'login') {
    $stmt = $pdo->prepare("SELECT * FROM clinics WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user && password_verify($password, $user['password_hash'])) {
        echo json_encode(["status" => "success", "user" => ["id" => $user['id'], "username" => $user['username'], "role" => $user['role']]]);
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid username or password"]);
    }
} elseif ($action === 'getUsers') {
    // Admin only check should be done here if we had session management, 
    // but for now we trust the client-side check.
    $stmt = $pdo->query("SELECT id, username, role FROM clinics");
    echo json_encode(["status" => "success", "users" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} elseif ($action === 'updateUserRole') {
    $userId = $input['userId'] ?? '';
    $role = $input['role'] ?? '';
    $stmt = $pdo->prepare("UPDATE clinics SET role = ? WHERE id = ?");
    $stmt->execute([$role, $userId]);
    echo json_encode(["status" => "success"]);
}
?>
