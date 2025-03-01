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
  sourceType?: string;
  isLoadingCopilot?: boolean;
  chatHistory?: { sender: 'user' | 'ai'; content: string }[];
}

function App() {
  // Initialize tickets from JSON data
  const [tickets, setTickets] = useState<Ticket[]>(ticketData.tickets);
  const [canvasTickets, setCanvasTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'wiki' | 'databases'>('wiki');

  // Handle reordering of tickets in the list
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
    // Update canvas tickets
    setCanvasTickets(prev =>
      prev.map(ticket =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    );

    // Also update the main tickets list
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === updatedTicket.id ? {
          ...ticket,
          status: updatedTicket.status // Ensure status is updated in main list
        } : ticket
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

  const handleTicketResolve = async (ticketId: number, solution: string) => {
    try {
      // Call the API to store the resolved ticket
      const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solution: solution,
          resolved_by: null, // The backend will use the ticket author if this is null
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show success notification to user
        alert('Solution saved to knowledge base for future similar tickets!');
        
        // Update the ticket status to "Resolved" if not already
        const updatedTickets = tickets.map(ticket => 
          ticket.id === ticketId && ticket.status !== 'Resolved' 
            ? { ...ticket, status: 'Resolved' } 
            : ticket
        );
        setTickets(updatedTickets);
        
        // Also update canvas tickets
        const updatedCanvasTickets = canvasTickets.map(ticket => 
          ticket.id === ticketId && ticket.status !== 'Resolved' 
            ? { ...ticket, status: 'Resolved' } 
            : ticket
        );
        setCanvasTickets(updatedCanvasTickets);
      } else {
        alert('Failed to save solution: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('Failed to save solution due to a server error.');
    }
  };

  const handleSolutionFeedback = async (ticketId: number, helpful: boolean) => {
    try {
      // Call the API to submit feedback
      const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticketId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          helpful: helpful
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.warn('Failed to record feedback:', data.message);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Effect to sync status changes between canvas and list
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
            onTicketResolve={handleTicketResolve}
            onSolutionFeedback={handleSolutionFeedback}
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