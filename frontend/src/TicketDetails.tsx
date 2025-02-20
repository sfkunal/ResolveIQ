import React from 'react';

interface Ticket {
  title: string;
  author: string;
  time: string;
  status: string;
  description: string;
}

interface TicketDetailsProps {
  ticket: Ticket | null;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket }) => {
  if (!ticket) {
    return (
      <div className="ticket-details-empty">
        <p>Select a ticket to view details</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="ticket-details">
      <div className="ticket-details-header">
        <div className={`status-badge ${ticket.status.toLowerCase()}`}>
          {ticket.status}
        </div>
        <h2 className="ticket-details-title">{ticket.title}</h2>
      </div>
      
      <div className="ticket-details-meta">
        <div className="meta-item">
          <span className="meta-label">Submitted by:</span>
          <span className="meta-value">{ticket.author}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Time:</span>
          <span className="meta-value">{formatDate(ticket.time)}</span>
        </div>
      </div>

      <div className="ticket-details-description">
        <h3>Description</h3>
        <p>{ticket.description}</p>
      </div>
    </div>
  );
};

export default TicketDetails;