import React, { useState, useRef } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';

interface Ticket {
  id: number;
  title: string;
  author: string;
  time: string;
  status: string;
  description: string;
  position?: { x: number; y: number };
}

interface TicketCanvasProps {
  tickets: Ticket[];
  onTicketUpdate: (updatedTicket: Ticket) => void;
  onTicketDrop: (ticket: Ticket, x: number, y: number) => void;
  onTicketRemove: (ticketId: number) => void;
}

const TicketCard: React.FC<{
  ticket: Ticket;
  onPositionChange: (x: number, y: number) => void;
  onRemove: (ticketId: number) => void;
}> = ({ ticket, onPositionChange, onRemove }) => {
  const nodeRef = useRef(null);
  
  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    onPositionChange(data.x, data.y);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={ticket.position || { x: 0, y: 0 }}
      onStop={handleDrag}
      bounds="parent"
    >
      <div ref={nodeRef} className="canvas-ticket">
        <button 
          className="ticket-remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(ticket.id);
          }}
        >
          ×
        </button>
        <button 
          className="ticket-copilot-btn"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Handle Copilot action
            console.log("Copilot clicked for ticket:", ticket.id);
          }}
        >
          <svg className="copilot-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
          Activate Copilot
        </button>
        <div className={`status-badge ${ticket.status.toLowerCase()}`}>
          {ticket.status}
        </div>
        <h3>{ticket.title}</h3>
        <div className="ticket-content">
          <p>{ticket.description}</p>
          <div className="ticket-meta">
            <span>{ticket.author}</span>
            <span>{new Date(ticket.time).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

const TicketCanvas: React.FC<TicketCanvasProps> = ({ 
  tickets, 
  onTicketUpdate, 
  onTicketDrop,
  onTicketRemove 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handlePositionChange = (ticket: Ticket, x: number, y: number) => {
    onTicketUpdate({
      ...ticket,
      position: { x, y }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const ticketData = e.dataTransfer.getData('ticket');
    if (ticketData) {
      const ticket = JSON.parse(ticketData);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onTicketDrop(ticket, x, y);
    }
  };

  return (
    <div 
      className={`ticket-canvas ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onPositionChange={(x, y) => handlePositionChange(ticket, x, y)}
          onRemove={onTicketRemove}
        />
      ))}
    </div>
  );
};

export default TicketCanvas; 