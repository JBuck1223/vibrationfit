<?php
// Quick test to see what URL format is in the database
header('Content-Type: application/json');

$url = "https://media.vibrationfit.com/user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/1761514706505-xly7m7gtpti-1761499380634-tyrn0egqlii-img-8882.mov";

preg_match('/media\.vibrationfit\.com\/(.+)/', $url, $matches);
$key = $matches[1] ?? null;

echo json_encode([
    'original' => $url,
    'extracted' => $key,
    'match' => $matches
], JSON_PRETTY_PRINT);
?>

