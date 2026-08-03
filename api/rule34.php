<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=120');

$tags = isset($_GET['tags']) ? (string) $_GET['tags'] : '';
$pid = isset($_GET['pid']) ? (int) $_GET['pid'] : 0;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 24;

$limit = max(1, min(100, $limit));
$pid = max(0, $pid);

if ($tags === '' || !preg_match('/^[a-z0-9_():+\-\s]+$/i', $tags)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid tags']);
  exit;
}

$query = http_build_query([
  'page' => 'dapi',
  's' => 'post',
  'q' => 'index',
  'json' => '1',
  'limit' => (string) $limit,
  'pid' => (string) $pid,
  'tags' => $tags,
]);

$url = "https://rule34.xxx/index.php?$query";
$context = stream_context_create([
  'http' => [
    'method' => 'GET',
    'timeout' => 12,
    'header' => "User-Agent: WuwaHentaiGallery/1.0\r\nAccept: application/json\r\n",
  ],
]);

$body = @file_get_contents($url, false, $context);

if ($body === false) {
  http_response_code(502);
  echo json_encode(['error' => 'Could not reach Rule34']);
  exit;
}

echo $body;
