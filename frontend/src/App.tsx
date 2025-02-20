import React, { useState } from 'react';
import './App.css';
import TicketList from './TicketList.tsx';
import TicketDetails from './TicketDetails.tsx';
import Chat from './Chat.tsx';

interface Ticket {
  id: number;
  title: string;
  author: string;
  time: string;
  status: string;
  description: string;
}

function App() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const handleTicketSelect = (ticket: Ticket, index: number) => {
    setSelectedTicket(ticket);
    setSelectedTicketId(ticket.id);
  };
  
  return (
    <div className="App">
      <div className="layout">
        <div className="left-column">
          <h2>Support Tickets</h2>
          <TicketList onSelectTicket={handleTicketSelect} />
        </div>

        <div className="middle-column">
          <TicketDetails ticket={selectedTicket} />
        </div>

        <div className="right-column">
          <h2>AI Assistant</h2>
          <Chat ticketId={selectedTicketId} />
        </div>
      </div>
    </div>
  );
}

export default App;
