// Chatbot functionality
document.addEventListener('DOMContentLoaded', function() {
    const chatbotToggler = document.querySelector('.chatbot-toggler');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const chatbotCloseBtn = document.querySelector('.chatbot-header .btn-close');
    const chatbotInput = document.querySelector('.chatbot-input input');
    const chatbotSendBtn = document.querySelector('.chatbot-input button');
    const chatbotBody = document.querySelector('.chatbot-body');

    // Sample questions for quick replies
    const quickQuestions = [
        "What are your business hours?",
        "Do you accept my insurance?",
        "How do I book an eye exam?",
        "What's your return policy?"
    ];

    // Toggle chatbot
    chatbotToggler.addEventListener('click', function() {
        chatbotContainer.classList.toggle('show');
    });

    // Close chatbot
    chatbotCloseBtn.addEventListener('click', function() {
        chatbotContainer.classList.remove('show');
    });

    // Send message
    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (message) {
            addMessage(message, 'user');
            chatbotInput.value = '';
            
            // Simulate bot response
            setTimeout(() => {
                const botResponse = getBotResponse(message);
                addMessage(botResponse, 'bot');
            }, 1000);
        }
    }

    // Send message on button click
    chatbotSendBtn.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatbotInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add message to chat
    function addMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        messageElement.textContent = message;
        chatbotBody.appendChild(messageElement);
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }

    // Generate bot response
    function getBotResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hour') || lowerMessage.includes('time')) {
            return "We're open Monday to Friday from 9AM to 6PM, and Saturday from 10AM to 4PM.";
        } else if (lowerMessage.includes('insurance')) {
            return "We accept most major vision insurance plans. Please call us at (123) 456-7890 to verify your coverage.";
        } else if (lowerMessage.includes('exam') || lowerMessage.includes('appointment')) {
            return "You can book an eye exam online through our appointment page or call us directly.";
        } else if (lowerMessage.includes('return') || lowerMessage.includes('exchange')) {
            return "We offer a 30-day return policy on all eyewear with original receipt. Prescription lenses cannot be returned.";
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
            return "You can reach us at (123) 456-7890 or info@visionplus.com. We're also available on WhatsApp!";
        } else {
            return "Thank you for your message! For detailed assistance, please call us at (123) 456-7890 or visit our contact page.";
        }
    }

    // Add quick questions to chat
    function addQuickQuestions() {
        const quickReplies = document.createElement('div');
        quickReplies.classList.add('quick-questions');
        
        quickQuestions.forEach(question => {
            const btn = document.createElement('button');
            btn.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'me-2', 'mb-2');
            btn.textContent = question;
            btn.addEventListener('click', function() {
                addMessage(question, 'user');
                
                setTimeout(() => {
                    const botResponse = getBotResponse(question);
                    addMessage(botResponse, 'bot');
                }, 1000);
            });
            
            quickReplies.appendChild(btn);
        });
        
        chatbotBody.appendChild(quickReplies);
    }

    // Initial bot greeting
    setTimeout(() => {
        addMessage("👋 Hi there! I'm VisionPlus Assistant. How can I help you today?", 'bot');
        addQuickQuestions();
    }, 500);
});