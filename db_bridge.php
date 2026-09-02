<?php
/**
 * HomeFaciliti Ultra-Robust Secure Database HTTPS Bridge
 * Parses .env DB credentials with literal fallback to ensure password is NEVER empty.
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

// Read database credentials directly from Laravel .env
$dbHost = '127.0.0.1';
$dbUser = 'homef4fw_homefaci';
$dbPass = '';
$dbName = 'homef4fw_homefaci';

$possibleEnvFiles = [
    dirname(__DIR__) . '/.env',
    __DIR__ . '/../.env',
    __DIR__ . '/.env',
    isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] . '/../.env' : '',
    isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] . '/.env' : ''
];

foreach ($possibleEnvFiles as $f) {
    if ($f && file_exists($f)) {
        $lines = @file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines) {
            foreach ($lines as $line) {
                $line = trim($line);
                if (strpos($line, '#') === 0) continue;
                if (strpos($line, 'DB_HOST=') === 0) $dbHost = trim(substr($line, 8), " \t\n\r\0\x0B\"'");
                if (strpos($line, 'DB_USERNAME=') === 0) $dbUser = trim(substr($line, 12), " \t\n\r\0\x0B\"'");
                if (strpos($line, 'DB_PASSWORD=') === 0) $dbPass = trim(substr($line, 12), " \t\n\r\0\x0B\"'");
                if (strpos($line, 'DB_DATABASE=') === 0) $dbName = trim(substr($line, 12), " \t\n\r\0\x0B\"'");
            }
        }
        if (!empty($dbPass)) break;
    }
}

// Hardcoded fallback if .env had empty password
if (empty($dbPass)) {
    $dbPass = 'Xnj3*t%F36RDK+!';
}

$conn = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($conn->connect_error) {
    $conn = @new mysqli('localhost', $dbUser, $dbPass, $dbName);
}

if ($conn->connect_error) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $conn->connect_error]);
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
    $types = '';
    $bindValues = [];
    foreach ($params as $param) {
        if (is_int($param)) $types .= 'i';
        elseif (is_double($param) || is_float($param)) $types .= 'd';
        else $types .= 's';
        $bindValues[] = $param;
    }
    $stmt->bind_param($types, ...$bindValues);
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

$jsonOutput = json_encode($out);
ob_end_clean();
echo $jsonOutput;
exit;
