<?php

class Chatbot {
    public static function onParserInit(Parser $parser) {
        // Register the <chatbot /> tag
        $parser->setHook('chatbot', [self::class, 'renderChatbot']);
    }

    public static function renderChatbot($input, array $args, Parser $parser, PPFrame $frame) {
        // Chatbot UI HTML
        $output = '<div id="chatbot-container">';
        $output .= '<div id="chatbox"></div>';
        $output .= '<input type="text" id="chat-input" placeholder="Ask me something...">';
        $output .= '<button id="send-btn">Send</button>';
        $output .= '</div>';
        
        // Load JavaScript and CSSv
        // $output .= '<script>mw.loader.load("ext.chatbot");</script>';
        // $parser->getOutput()->addModules('ext.chatbot');
        $output .= '<script src="/w/extensions/PrabhupadaChat/modules/chatbot.js?v=1.16"></script>';
        $output .= '<link rel="stylesheet" href="/w/extensions/PrabhupadaChat/modules/chatbot.css">';
        
        // google sign in script
        $output .= '<script src="https://accounts.google.com/gsi/client" async defer></script>';
        $output .= '<div id="g_id_onload"';
        $output .=  'data-client_id="593414224796-21jq8u0cee4fodm00q65176jdk632vup.apps.googleusercontent.com"';
        $output .=  'data-callback="handleCredentialResponse">';
        $output .= '</div>';
        $output .=  '<div class="g_id_signin"></div>';
        
        $output .= '<script>';
        $output .=  'function handleCredentialResponse(response) {';
        // Send response.credential (JWT) to your backend for verification
        $output .= 'console.log("credentials",response.credential);';
        $output .= "sendCredentialResponse(response)";
        $output .= '}';
        $output .= '</script>';

        return $output;
    }
}
