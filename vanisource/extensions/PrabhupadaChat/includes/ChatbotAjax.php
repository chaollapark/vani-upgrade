<?php

class ChatbotAjax {
    public static function getResponse($query) {
    $escapedQuery = escapeshellarg($query);
    $output = shell_exec("python3 /var/www/vanipedia/prabhupadachat/prabhupadachat.sh $escapedQuery 2>&1");

    if (!$output) {
        return json_encode(['response' => "Error: Chatbot script failed to run."]);
    }

    return json_encode(['response' => trim($output)]);
}

}
