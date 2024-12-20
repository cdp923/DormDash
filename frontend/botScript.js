// API endpoint and your OpenAI API key
const API_KEY = 'myKey';
const API_URL = 'https://api.openai.com/v1/chat/completions';  // Update to GPT-4 endpoint

// Function to display the message in the chatbox
function displayMessage(message, sender) {
  const messageContainer = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
  messageElement.textContent = message;
  messageContainer.appendChild(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight; // Scroll to the bottom
}

// Function to get GPT-4 response
async function getBotResponse(userMessage) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',  // Use the GPT-4 model
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },  // System message for setup
            { role: 'user', content: userMessage }  // User input
          ],
          max_tokens: 60,
          temperature: 0.1,
        }),
      });
  
      const data = await response.json();
      console.log(data);  // Log the full response for debugging
  
      // Check if the response contains valid choices
      if (data.error) {
        console.error('API Error:', data.error.message);
        return "There was an issue with the API request. Please try again.";
      }
  
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();  // Return the bot's response text
      } else {
        console.error("No valid response found:", data);
        return "Sorry, I didn't get a response. Please try again.";
      }
    } catch (error) {
      console.error('Error with OpenAI API:', error);
      return "There was an error processing your request. Please try again.";
    }
}

// Event listener for the "Send" button
document.getElementById('sendBtn').addEventListener('click', async () => {
  const userMessage = document.getElementById('inputText').value;
  if (userMessage.trim() === '') return;

  // Display user message
  displayMessage(userMessage, 'user');
  document.getElementById('inputText').value = ''; // Clear input field

  // Get and display bot response
  const botResponse = await getBotResponse(userMessage);
  displayMessage(botResponse, 'bot');
});

// Optional: Handle "Enter" key press to send message
document.getElementById('inputText').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('sendBtn').click();
  }
});