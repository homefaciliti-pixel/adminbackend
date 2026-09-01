<?php
/**
 * HomeFaciliti Secure Database HTTPS Bridge
 * Auto-detects DB credentials from Laravel .env file for 100% guaranteed connection success.
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

$SECURITY_KEY = 'HF_SECURE_KEY_2026_x92!';

$incomingKey = isset($_SERVER['HTTP_X_BRIDGE_SECRET']) ? $_SERVER['HTTP_X_BRIDGE_SECRET'] : '';
if ($incomingKey !== $SECURITY_KEY) {
    ob_end_clean();
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized Access']);
    exit;
}

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!$data || empty($data['sql'])) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing SQL query payload']);
    exit;
}

// Auto-detect DB credentials from Laravel .env file if available
$dbHost = '127.0.0.1';
$dbUser = 'homef4fw_homefaci';
$dbPass = 'Xnj3*t%' . chr(36) . 'F36RDK+!';
$dbName = 'homef4fw_homefaci';

$envPaths = [
    __DIR__ . '/.env',
    __DIR__ . '/../.env',
    dirname(__DIR__) . '/.env'
];

foreach ($envPaths as $envPath) {
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v, " \t\n\r\0\x0B\"'");
                if ($k === 'DB_HOST') $dbHost = $v;
                if ($k === 'DB_USERNAME' || $k === 'DB_USER') $dbUser = $v;
                if ($k === 'DB_PASSWORD' || $k === 'DB_PASS') $dbPass = $v;
                if ($k === 'DB_DATABASE' || $k === 'DB_NAME') $dbName = $v;
            }
        }
        break;
    }
}

$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);

if ($conn->connect_error) {
    $conn = new mysqli('localhost', $dbUser, $dbPass, $dbName);
}

if ($conn->connect_error) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$conn->set_charset('utf8mb4');
$sql = $data['sql'];
$params = isset($data['params']) && is_array($data['params']) ? $data['params'] : [];

$stmt = $conn->prepare($sql);
if (!$stmt) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
    $conn->close();
    exit;
}

if (!empty($params)) {
    $types = '';
    $bindValues = [];
    foreach ($params as $param) {
        if (is_int($param)) {
            $types .= 'i';
        } elseif (is_double($param) || is_float($param)) {
            $types .= 'd';
        } else {
            $types .= 's';
        }
        $bindValues[] = $param;
    }
    $stmt->bind_param($types, ...$bindValues);
}

if (!$stmt->execute()) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Execution failed: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();

if ($result === false) {
    $response = [
        'success' => true,
        'affectedRows' => $stmt->affected_rows,
        'insertId' => $stmt->insert_id
    ];
} else {
    $rows = $result->fetch_all(MYSQLI_ASSOC);
    $response = [
        'success' => true,
        'rows' => $rows
    ];
    $result->free();
}

$stmt->close();
$conn->close();

$jsonOutput = json_encode($response);
ob_end_clean();
echo $jsonOutput;
exit;
