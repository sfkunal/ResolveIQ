import React, { useState, useEffect } from 'react';

interface Ticket {
  id: number;
  title: string;
  author: string;
  time: string;
  status: string;
  description: string;
}

interface TicketListProps {
  tickets: Ticket[];
  onTicketsReorder: (reorderedTickets: Ticket[]) => void;
  onSelectTicket: (ticket: Ticket) => void;
}

type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'All';

const TicketList: React.FC<TicketListProps> = ({ tickets, onTicketsReorder, onSelectTicket }) => {
  const [activeTab, setActiveTab] = useState<TicketStatus>('All');
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'All') return true;
    return ticket.status === activeTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleReorderDragStart = (ticket: Ticket, index: number, e: React.DragEvent) => {
    setDraggedTicket(ticket);
    
    if (e.dataTransfer.setDragImage) {
      const element = e.currentTarget;
      e.dataTransfer.setDragImage(element, 20, 20);
    }
    
    e.dataTransfer.setData('ticket', JSON.stringify(ticket));
  };

  const handleReorderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTicket === null) return;
    setDraggedOverIndex(index);
  };

  const handleReorderDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedTicket === null) return;
    
    const draggedIndex = tickets.findIndex(t => t.id === draggedTicket.id);
    if (draggedIndex === -1) return;
    
    const filteredDropTicket = filteredTickets[dropIndex];
    const targetIndex = tickets.findIndex(t => t.id === filteredDropTicket.id);
    
    const newTickets = [...tickets];
    const [removed] = newTickets.splice(draggedIndex, 1);
    newTickets.splice(targetIndex, 0, removed);
    
    onTicketsReorder(newTickets);
    setDraggedTicket(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTicket(null);
    setDraggedOverIndex(null);
  };

  return (
    <div className="ticket-list-container">
      <div className="ticket-tabs">
        <button 
          className={`ticket-tab ${activeTab === 'All' ? 'active' : ''}`}
          onClick={() => setActiveTab('All')}
        >
          All
        </button>
        <button 
          className={`ticket-tab ${activeTab === 'Open' ? 'active' : ''}`}
          onClick={() => setActiveTab('Open')}
        >
          Open
        </button>
        <button 
          className={`ticket-tab ${activeTab === 'In Progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('In Progress')}
        >
          In Progress
        </button>
        <button 
          className={`ticket-tab ${activeTab === 'Resolved' ? 'active' : ''}`}
          onClick={() => setActiveTab('Resolved')}
        >
          Resolved
        </button>
      </div>
      
      <div className="ticket-list">
        {filteredTickets.length === 0 ? (
          <div className="no-tickets-message">
            No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} tickets found
          </div>
        ) : (
          filteredTickets.map((ticket, index) => {
            const isBeingDragged = draggedTicket?.id === ticket.id;
            const isDraggedOver = draggedOverIndex === index && !isBeingDragged;
            
            return (
              <div 
                key={ticket.id} 
                className={`ticket-item ${isDraggedOver ? 'drag-over' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                draggable={true}
                onDragStart={(e) => handleReorderDragStart(ticket, index, e)}
                onDragOver={(e) => handleReorderDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleReorderDrop(e, index)}
                onClick={() => onSelectTicket(ticket)}
              >
                <div className="drag-indicator">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 9H16M8 12H16M8 15H16" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={`status-badge ${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {ticket.status}
                </div>
                <h3 className="ticket-title">{ticket.title}</h3>
                <div className="ticket-meta">
                  <span className="ticket-author">{ticket.author}</span>
                  <span className="ticket-time">{formatDate(ticket.time)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TicketList;