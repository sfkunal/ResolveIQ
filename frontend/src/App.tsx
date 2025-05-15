import React, { useState, useEffect } from 'react';
import './App.css';
import TicketList from './TicketList.tsx';
import TicketCanvas from './TicketCanvas.tsx';
import KnowledgeWiki from './KnowledgeWiki.tsx';
import Databases from './Databases.tsx';
import 'react-resizable/css/styles.css';
import ticketData from './support_tickets.json';

interface Ticket {
  id: number;
  title: string;
  author: string;
  time: string;
  status: string;
  description: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  copilotResponse?: string;
  reference?: string;
  isLoadingCopilot?: boolean;
  chatHistory?: { sender: 'user' | 'ai'; content: string }[];
}

function App() {
  const [tickets, setTickets] = useState<Ticket[]>(ticketData.tickets);
  const [canvasTickets, setCanvasTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'wiki' | 'databases'>('wiki');
  const [activeReference, setActiveReference] = useState<string | undefined>(undefined);

  const handleTicketsReorder = (reorderedTickets: Ticket[]) => {
    setTickets(reorderedTickets);
  };

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

    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === updatedTicket.id ? {
          ...ticket,
          status: updatedTicket.status
        } : ticket
      )
    );

    if (updatedTicket.reference && !updatedTicket.isLoadingCopilot) {
      setActiveReference(updatedTicket.reference);
      setActiveTab('wiki');
    }
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

  useEffect(() => {
    const updatedTickets = tickets.map(ticket => {
      const canvasTicket = canvasTickets.find(ct => ct.id === ticket.id);
      return canvasTicket ? { ...ticket, status: canvasTicket.status } : ticket;
    });
    setTickets(updatedTickets);
  }, [canvasTickets]);

  return (
    <div className="App">
      <div className="layout">
        <div className="left-column">
          <div style={{ 
            paddingTop: '20px', 
            marginTop: '-20px', 
            overflow: 'visible'
          }}>
            <img src="logo.png" alt="Logo" className="logo-image"></img>
            <h2 style={{ marginTop: '0' }}>Support Tickets</h2>
          </div>
          <TicketList 
            tickets={tickets} 
            onTicketsReorder={handleTicketsReorder}
            onSelectTicket={handleTicketSelect} 
          />
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
            {activeTab === 'wiki' ? <KnowledgeWiki activeReference={activeReference} /> : <Databases />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
