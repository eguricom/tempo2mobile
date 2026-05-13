<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$dbPath = __DIR__ . "/gps.sqlite";
$db = new SQLite3($dbPath);
$db->exec("CREATE TABLE IF NOT EXISTS gps_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    shift_id TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    ts TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
)");
$db->exec("CREATE INDEX IF NOT EXISTS idx_gps_user ON gps_points(user_id)");
$db->exec("CREATE INDEX IF NOT EXISTS idx_gps_shift ON gps_points(shift_id)");

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input || !isset($input["userId"]) || !isset($input["lat"]) || !isset($input["lng"])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing fields"]);
        exit;
    }
    $stmt = $db->prepare("INSERT INTO gps_points (user_id, shift_id, lat, lng, ts) VALUES (:uid, :sid, :lat, :lng, :ts)");
    $stmt->bindValue(":uid", $input["userId"], SQLITE3_TEXT);
    $stmt->bindValue(":sid", $input["shiftId"] ?? "", SQLITE3_TEXT);
    $stmt->bindValue(":lat", $input["lat"], SQLITE3_FLOAT);
    $stmt->bindValue(":lng", $input["lng"], SQLITE3_FLOAT);
    $stmt->bindValue(":ts", $input["ts"] ?? date("c"), SQLITE3_TEXT);
    $stmt->execute();
    echo json_encode(["ok" => true, "id" => $db->lastInsertRowID()]);
    exit;
}

if ($method === "GET") {
    $userId = $_GET["userId"] ?? null;
    $shiftId = $_GET["shiftId"] ?? null;
    $date = $_GET["date"] ?? date("Y-m-d");

    $sql = "SELECT * FROM gps_points WHERE 1=1";
    $params = [];
    if ($userId) { $sql .= " AND user_id = :uid"; $params[":uid"] = $userId; }
    if ($shiftId) { $sql .= " AND shift_id = :sid"; $params[":sid"] = $shiftId; }
    if ($date) { $sql .= " AND date(ts) = :dt"; $params[":dt"] = $date; }
    $sql .= " ORDER BY ts ASC";

    $stmt = $db->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v, SQLITE3_TEXT);
    $res = $stmt->execute();
    $points = [];
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) $points[] = $row;
    echo json_encode($points);
    exit;
}

if ($method === "DELETE") {
    $db->exec("DELETE FROM gps_points WHERE ts < datetime('now', '-30 days')");
    echo json_encode(["ok" => true, "cleaned" => true]);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
