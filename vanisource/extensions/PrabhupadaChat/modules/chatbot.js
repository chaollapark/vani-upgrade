// Ensure jQuery and mw are available before executing the script
function initChatbot() {
    if (typeof($) === "undefined") {
        setTimeout(initChatbot, 500);
        return;
    }

    $(document).ready(function () {
        // Send message when clicking "Send" button
        $("#send-btn").on("click", function () {
            sendMessage();
        });

        // Send message when pressing "Enter"
        $("#chat-input").on("keypress", function (e) {
            if (e.which === 13) {  // Enter key code
                sendMessage();
            }
        });

        // Function to format bot response (highlight headings, format links, etc.)
        function processResponse(response) {
        // Handle headers
        response = response.replace(/^###\s*(.*?)$/gm, "<span class='highlight'>$1</span>");
        
        // Handle section headers (## text)
        response = response.replace(/^##\s*(.*?)$/gm, "<h2>$1</h2>");
        
        // Handle subsection headers (### text)
        response = response.replace(/^###\s*(.*?)$/gm, "<h3>$1</h3>");
        
        // Handle blockquotes
        response = response.replace(/^>\s*(.*?)$/gm, "<blockquote>$1</blockquote>");
        
        // Format bold text
        response = response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        
        // Format italic text
        response = response.replace(/\*(.*?)\*/g, "<em>$1</em>");
        
        // Format links
        response = response.replace(/\[(.*?)\]\((https?:\/\/\S+)\)/g, "<a href='$2' target='_blank'>$1</a>");
        
        // Handle plain URLs
        response = response.replace(/\((https?:\/\/\S+)\)/g, "<a href='$1' target='_blank'><img src='/w/extensions/PrabhupadaChat/images/link.svg' alt='link'/></a>");
        
        // Handle emojis (like the ones in your prompt)
        response = response.replace(/ðŸ"¹/g, "📹");
        
        // Handle horizontal rules
        response = response.replace(/^---$/gm, "<hr>");
        
        // Convert line breaks to <br> tags
        response = response.replace(/\n/g, "<br>");
    
        return response;
        }

        // Function to append messages to chatbox with styling
        function appendMessage(sender, message, isLoading = false) {
            let chatbox = $("#chatbox");

            let messageDiv = $("<div>").addClass("message");
            let textSpan = $("<span>").addClass(sender === "user" ? "user-message" : "bot-message");

            if (isLoading) {
                textSpan.html(`<img src='/w/extensions/PrabhupadaChat/images/wait.gif' alt='Thinking...'/>`);
            } else {
                textSpan.html(message);
            }

            messageDiv.append(textSpan);
            chatbox.append(messageDiv);

            // Auto-scroll to the latest message
            chatbox.scrollTop(chatbox[0].scrollHeight);
        }

        // Function to send user message to the chatbot
        function sendMessage() {
            let userInput = $("#chat-input").val().trim();
            if (userInput === "") return;  // Avoid sending empty messages

            // Display user message in chatbox
            appendMessage("user", userInput);

            // Show "Thinking..." message from bot
            let botMessageElement = $("<div>").addClass("message").append(
                $("<span>").addClass("bot-message").html(`<img src='/w/extensions/PrabhupadaChat/images/wait.gif' alt='Thinking...'/>`)
            );
            $("#chatbox").append(botMessageElement);
            $("#chat-input").val("");  // Clear input field

            // Send AJAX request to get chatbot response
            $.ajax({
                url: mw.util.wikiScript("api"),  // MediaWiki API URL
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                data: {
                    action: "chatbot",
                    format: "json",
                    query: userInput
                },
                success: function (data) {
                    let response = JSON.parse(data.chatbotresponse).response.trim();

                    // Process response for highlights and links
                    let botResponse = processResponse(response);

                    // Update the "Thinking..." message with actual response
                    botMessageElement.find(".bot-message").html(botResponse);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error("Error communicating with the chatbot:", textStatus, errorThrown);
                    botMessageElement.find(".bot-message").html("<span class='error'>Error communicating with the chatbot.</span>");
                }
            });
        }
    });
}

function sendCredentialResponse(response) {
  const jwt = response.credential;

  // Send it to your backend
  fetch('/api/auth/google.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: jwt })
  })
  .then(res => res.json())
  .then(data => {
    console.log('User info:', data);
  });
}
                
// Initialize chatbot
initChatbot();
