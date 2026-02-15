<?php

class GoogleAuthApi extends ApiBase {
    public function execute() {
        $params = $this->extractRequestParams();
        $token = $params['token'];
        
        // Verify the token
        $result = $this->verifyGoogleToken($token);
        
        $this->getResult()->addValue(null, $this->getModuleName(), $result);
    }
    
    private function verifyGoogleToken($token) {
        if (empty($token)) {
            return json_encode(['success' => false, 'error' => 'No token provided']);
        }
        
        // Parse token (JWT) parts
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return json_encode(['success' => false, 'error' => 'Invalid token format']);
        }
        
        // Decode payload (middle part of JWT)
        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        
        // Basic validation
        if (!$payload || !isset($payload['sub'])) {
            return json_encode(['success' => false, 'error' => 'Invalid token payload']);
        }
        
        // Extract user info
        $userData = [
            'success' => true,
            'userId' => $payload['sub'],
            'name' => $payload['name'] ?? '',
            'email' => $payload['email'] ?? '',
            'picture' => $payload['picture'] ?? ''
        ];
        
        return json_encode($userData);
    }
    
    public function getAllowedParams() {
        return [
            'token' => [
                ApiBase::PARAM_TYPE => 'string',
                ApiBase::PARAM_REQUIRED => true,
            ],
        ];
    }
    
    public function needsToken() {
        return false;
    }
    
    public function isWriteMode() {
        return false;
    }
}