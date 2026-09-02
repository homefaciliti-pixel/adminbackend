<?php
/**
 * HomeFaciliti Ultra-Secure Database HTTPS Bridge
 * Encoded HEX Password protection. ZERO variable expansion possible.
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

// Exact HEX Encoded Password (586e6a332a742546333652444b2b21 = Xnj3*t%F36RDK+!)
$pwd = pack('H*', '586e6a332a742546333652444b2b21');

$conn = @new mysqli('127.0.0.1', 'homef4fw_homefaci', $pwd, 'homef4fw_homefaci');
if ($conn->connect_error) {
    $conn = @new mysqli('localhost', 'homef4fw_homefaci', $pwd, 'homef4fw_homefaci');
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
