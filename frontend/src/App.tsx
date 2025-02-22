import React, { useState } from 'react';
import './App.css';
import TicketList from './TicketList.tsx';
import TicketCanvas from './TicketCanvas.tsx';
import KnowledgeWiki from './KnowledgeWiki.tsx';
import Databases from './Databases.tsx';
import 'react-resizable/css/styles.css';

interface Ticket {
  id: number;
  title: string;
  author: string;
  time: string;
  status: string;
  description: string;
  position?: { x: number; y: number };
}

function App() {
  const [canvasTickets, setCanvasTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'wiki' | 'databases'>('wiki');

  const handleTicketSelect = (ticket: Ticket) => {
    addTicketToCanvas(ticket);
  };

  const addTicketToCanvas = (ticket: Ticket, x?: number, y?: number) => {
    if (!canvasTickets.find(t => t.id === ticket.id)) {
      setCanvasTickets(prev => [...prev, {
        ...ticket,
        position: { 
          x: x ?? Math.random() * 100, 
          y: y ?? Math.random() * 100 
        }
      }]);
    }
  };

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    setCanvasTickets(prev =>
      prev.map(ticket =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    );
  };

  const handleTicketDrop = (ticket: Ticket, x: number, y: number) => {
    addTicketToCanvas(ticket, x, y);
  };

  const handleTicketRemove = (ticketId: number) => {
    setCanvasTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
  };

  const handleChatOpen = (ticketId: number) => {
    console.log('Opening chat for ticket:', ticketId);
  };

  return (
    <div className="App">
      <div className="layout">
        <div className="left-column">
          <h2>Support Tickets</h2>
          <TicketList onSelectTicket={handleTicketSelect} />
        </div>

        <div className="middle-column">
          <TicketCanvas 
            tickets={canvasTickets}
            onTicketUpdate={handleTicketUpdate}
            onTicketDrop={handleTicketDrop}
            onTicketRemove={handleTicketRemove}
            onChatOpen={handleChatOpen}
          />
        </div>

        <div className="right-column">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'wiki' ? 'active' : ''}`}
              onClick={() => setActiveTab('wiki')}
            >
              Knowledge Wiki
            </button>
            <button 
              className={`tab-button ${activeTab === 'databases' ? 'active' : ''}`}
              onClick={() => setActiveTab('databases')}
            >
              Databases
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'wiki' ? <KnowledgeWiki /> : <Databases />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
