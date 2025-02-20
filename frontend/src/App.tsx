import React, { useState } from 'react';
import './App.css';
import TicketList from './TicketList.tsx';
import TicketDetails from './TicketDetails.tsx';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
}

function App() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  return (
    <div className="App">
      <div className="layout">
        <div className="left-column">
          <h2>Support Tickets</h2>
          <TicketList onSelectTicket={setSelectedTicket} />
        </div>

        <div className="middle-column">
          <TicketDetails ticket={selectedTicket} />
        </div>

        <div className="right-column">
          <h2>AI Assistant</h2>
          <div className="chat-container">
            <div className="chat-messages">
            </div>
            <div className="chat-input">
              <input 
                type="text" 
                placeholder="Type your message..."
              />
              <button>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
