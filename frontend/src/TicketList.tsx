import React from 'react';
import ticketData from './support_tickets.json';

interface Ticket {
  id: number;
  title: string;
  author: string;
  time: string;
  status: string;
  description: string;
}

interface TicketListProps {
  onSelectTicket: (ticket: Ticket) => void;
}

const TicketList: React.FC<TicketListProps> = ({ onSelectTicket }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDragStart = (ticket: Ticket, e: React.DragEvent) => {
    e.dataTransfer.setData('ticket', JSON.stringify(ticket));
  };

  return (
    <div className="ticket-list">
      {ticketData.tickets.map((ticket, index) => (
        <div 
          key={index} 
          className="ticket-item"
          draggable
          onDragStart={(e) => handleDragStart(ticket, e)}
          onClick={() => onSelectTicket(ticket)}
        >
          <div className={`status-badge ${ticket.status.toLowerCase()}`}>
            {ticket.status}
          </div>
          <h3 className="ticket-title">{ticket.title}</h3>
          <div className="ticket-meta">
            <span className="ticket-author">{ticket.author}</span>
            <span className="ticket-time">{formatDate(ticket.time)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketList;