const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addMessageToChat('User', message);
        userInput.value = '';

        // Send message to backend
        try {
            const response = await fetch('https://YOUR_CLOUD_FUNCTION_URL', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: message }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.text();
            addMessageToChat('Chatbot', data);
        } catch (error) {
            console.error('Error:', error);
            addMessageToChat('Chatbot', 'Sorry, there was an error processing your request.');
        }
    }
}

function addMessageToChat(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}