import React, { useState, useRef, useEffect } from 'react';

interface Message {
  sender: 'user' | 'ai';
  content: string;
}

interface ChatPanelProps {
  ticketId: number;
  initialContext: string;
  chatHistory: Message[];
  onClose: () => void;
  onUpdateHistory: (history: Message[]) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  ticketId, 
  initialContext, 
  chatHistory, 
  onClose,
  onUpdateHistory 
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const formatChatHistory = (history: Message[]) => {
    return history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const newMessage: Message = { sender: 'user', content: message };
    const updatedHistory = [...chatHistory, newMessage];
    onUpdateHistory(updatedHistory);
    setMessage('');
    setIsLoading(true);

    try {
      // Format the chat history for the API
      const formattedHistory = updatedHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Prepare the request payload
      const payload = {
        ticketId: ticketId,
        message: message,
        history: formattedHistory,
        context: initialContext
      };

      console.log('Sending payload:', payload); // Debug log

      const response = await fetch(`http://127.0.0.1:5000/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      onUpdateHistory([...updatedHistory, { sender: 'ai', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      onUpdateHistory([
        ...updatedHistory,
        { sender: 'ai', content: 'Sorry, I encountered an error processing your request.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Chat Assistant</h3>
        <button className="chat-close-btn" onClick={onClose}>×</button>
      </div>
      <div className="chat-messages">
        <div className="system-message">
          Initial context from Copilot:
          <pre>{initialContext}</pre>
        </div>
        {chatHistory.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}-message`}>
            <div className="message-content">{msg.content}</div>
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !message.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel; 