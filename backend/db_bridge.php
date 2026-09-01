<?php
/**
 * HomeFaciliti Secure Database HTTPS Bridge
 * Auto-parses .env DB credentials + Base64 fallback.
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

// Default credentials
$h = '127.0.0.1';
$u = 'homef4fw_homefaci';
$p = base64_decode('WG5qMyp0JUYzNlJESysh');
$d = 'homef4fw_homefaci';

// Read .env if present
$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/.env';
}
if (file_exists($envFile)) {
    $c = file_get_contents($envFile);
    if (preg_match('/DB_HOST=(.*)/', $c, $m)) $h = trim($m[1], " \t\n\r\0\x0B\"'");
    if (preg_match('/DB_USERNAME=(.*)/', $c, $m)) $u = trim($m[1], " \t\n\r\0\x0B\"'");
    if (preg_match('/DB_PASSWORD=(.*)/', $c, $m)) $p = trim($m[1], " \t\n\r\0\x0B\"'");
    if (preg_match('/DB_DATABASE=(.*)/', $c, $m)) $d = trim($m[1], " \t\n\r\0\x0B\"'");
}

$conn = new mysqli($h, $u, $p, $d);
if ($conn->connect_error) {
    $conn = new mysqli('localhost', $u, $p, $d);
}

if ($conn->connect_error) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $conn->connect_error]);
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
