<?php
/**
 * HomeFaciliti Ultra-Robust Secure Database HTTPS Bridge
 * Iterates through all .env and fallback credentials across 127.0.0.1 & localhost.
 */
ob_start();
error_reporting(0);
ini_set('display_errors', '0');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Bridge-Secret');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

if (!isset($_SERVER['HTTP_X_BRIDGE_SECRET']) || $_SERVER['HTTP_X_BRIDGE_SECRET'] !== 'HF_SECURE_KEY_2026_x92!') {
    ob_end_clean();
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized Access']);
    exit;
}

$raw = file_get_contents('php://input');
$reqData = json_decode($raw, true);

if (!$reqData || empty($reqData['sql'])) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing SQL query']);
    exit;
}

// Credentials candidates
$hosts = ['127.0.0.1', 'localhost'];
$users = ['homef4fw_homefaci'];
$passes = [base64_decode('WG5qMyp0JUYzNlJESysh')];

// Try reading .env file
$envCandidates = [
    dirname(__DIR__) . '/.env',
    __DIR__ . '/../.env',
    __DIR__ . '/.env'
];

foreach ($envCandidates as $envFile) {
    if (file_exists($envFile)) {
        $lines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines) {
            foreach ($lines as $line) {
                if (strpos(trim($line), 'DB_PASSWORD=') === 0) {
                    $val = trim(substr(trim($line), 12), " \t\n\r\0\x0B\"'");
                    if ($val) array_unshift($passes, $val);
                }
                if (strpos(trim($line), 'DB_USERNAME=') === 0) {
                    $val = trim(substr(trim($line), 12), " \t\n\r\0\x0B\"'");
                    if ($val) array_unshift($users, $val);
                }
            }
        }
    }
}

$conn = null;
$dbName = 'homef4fw_homefaci';

foreach ($users as $u) {
    foreach ($passes as $p) {
        foreach ($hosts as $h) {
            $testConn = @new mysqli($h, $u, $p, $dbName);
            if (!$testConn->connect_error) {
                $conn = $testConn;
                break 3;
            }
        }
    }
}

if (!$conn || $conn->connect_error) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$conn->set_charset('utf8mb4');
$sql = $reqData['sql'];
$params = isset($reqData['params']) && is_array($reqData['params']) ? $reqData['params'] : [];

$stmt = $conn->prepare($sql);
if (!$stmt) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Prepare: ' . $conn->error]);
    $conn->close();
    exit;
}

if (!empty($params)) {
    $t = '';
    $bv = [];
    foreach ($params as $param) {
        if (is_int($param)) $t .= 'i';
        elseif (is_double($param) || is_float($param)) $t .= 'd';
        else $t .= 's';
        $bv[] = $param;
    }
    $stmt->bind_param($t, ...$bv);
}

if (!$stmt->execute()) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Execute: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$res = $stmt->get_result();
if ($res === false) {
    $out = ['success' => true, 'affectedRows' => $stmt->affected_rows, 'insertId' => $stmt->insert_id];
} else {
    $out = ['success' => true, 'rows' => $res->fetch_all(MYSQLI_ASSOC)];
    $res->free();
}

$stmt->close();
$conn->close();

$json = json_encode($out);
ob_end_clean();
echo $json;
exit;
