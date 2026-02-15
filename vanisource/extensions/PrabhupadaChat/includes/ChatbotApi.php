<?php

use MediaWiki\MediaWikiServices;
use MediaWiki\Logger\LoggerFactory;

class ChatbotApi extends ApiBase {
    public function execute() {
        $params = $this->extractRequestParams();
        $response = $this->getResponseData($params['query']);
        
        $this->getResult()->addValue(null, 'chatbotresponse', $response);
    }

    private function getResponseData($query) {
        $escapedQuery = escapeshellarg($query);
        $output = shell_exec("/var/www/vanipedia/prabhupadachat/prabhupadachat.sh $escapedQuery 2>&1");
    
        if (!$output) {
            return json_encode(['response' => "Error: Chatbot script failed to run."]);
        }
    
        return json_encode(['response' => trim($output)]);
    }

    public function getAllowedParams() {
        return [
            'query' => [
                ApiBase::PARAM_TYPE => 'string',
                ApiBase::PARAM_REQUIRED => true,
            ],
        ];
    }
}
?>
