import React, { useState, useRef, useEffect } from 'react';

interface Message {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatProps {
  ticketId: number | null;
}

const Chat: React.FC<ChatProps> = ({ ticketId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('Debug state:', {
      ticketId,
      isLoading,
      isDisabled: !ticketId || isLoading
    });
  }, [ticketId, isLoading]);

  const handleSendMessage = async () => {
    if (ticketId === null || !inputMessage.trim()) return;

    const userMessage: Message = {
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Convert messages to the format expected by the backend
    const chatHistory = messages.map(msg => ({
      content: msg.content,
      sender: msg.sender
    }));

    try {
      const response = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticketId,
          message: inputMessage,
          chatHistory: chatHistory
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        content: data.response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          disabled={ticketId === null || isLoading}
        />
        <button 
          onClick={handleSendMessage}
          disabled={ticketId === null || isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;