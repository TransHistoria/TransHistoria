<?php
/**
 * rename this file to a different entrypoint
 * and generate a different token
 */
declare(strict_types=1);
$expectedToken = getenv('DEPLOY_TOKEN') ?: 'random_generated_token_epsi093idwkokcijiojff32';
$workDir = __DIR__;
header('Content-Type: text/plain; charset=utf-8');
$headers = getallheaders();
if($headers['X-DEPLOY-TOKEN'] && $headers['X-DEPLOY-TOKEN'] === $expectedToken) {
    http_response_code(200);
    exec('docker compose up -d --pull always --force-recreate');
}
else http_response_code(502);
?>