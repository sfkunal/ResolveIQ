import React, { useState, useRef } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import ChatPanel from './ChatPanel.tsx';
import ReactMarkdown from 'react-markdown';

interface Ticket {
  id: number;
  title: string;
  author: string;
  time: string;
  status: string;
  description: string;
  position?: { x: number; y: number };
  copilotResponse?: string;
  isLoadingCopilot?: boolean;
  chatHistory?: { sender: 'user' | 'ai'; content: string }[];
}

interface TicketCanvasProps {
  tickets: Ticket[];
  onTicketUpdate: (updatedTicket: Ticket) => void;
  onTicketDrop: (ticket: Ticket, x: number, y: number) => void;
  onTicketRemove: (ticketId: number) => void;
  onChatOpen: (ticketId: number) => void;
}

const TicketCard: React.FC<{
  ticket: Ticket;
  onPositionChange: (x: number, y: number) => void;
  onRemove: (ticketId: number) => void;
  onCopilot: (ticketId: number) => void;
  onChatOpen: (ticketId: number) => void;
}> = ({ ticket, onPositionChange, onRemove, onCopilot, onChatOpen }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  
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
      <div ref={nodeRef} className="ticket-wrapper">
        <div className="canvas-ticket">
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
              onCopilot(ticket.id);
            }}
            disabled={ticket.isLoadingCopilot}
          >
            <svg className="copilot-icon" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            {ticket.isLoadingCopilot ? 'Processing...' : 'Activate Copilot'}
          </button>
          {ticket.copilotResponse && (
            <button 
              className="ticket-chat-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChatOpen(ticket.id);
              }}
            >
              <svg className="chat-icon" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              Chat
            </button>
          )}
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
        {(ticket.copilotResponse || ticket.isLoadingCopilot) && (
          <div className="copilot-response">
            <ReactMarkdown>{ticket.copilotResponse || ''}</ReactMarkdown>
          </div>
        )}
      </div>
    </Draggable>
  );
};

const TicketCanvas: React.FC<TicketCanvasProps> = ({ 
  tickets, 
  onTicketUpdate, 
  onTicketDrop,
  onTicketRemove,
  onChatOpen
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeChatTicketId, setActiveChatTicketId] = useState<number | null>(null);
  
  const handlePositionChange = (ticket: Ticket, x: number, y: number) => {
    onTicketUpdate({
      ...ticket,
      position: { x, y }
    });
  };

  const handleCopilot = async (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    console.log("solving ticket id:", ticketId);

    onTicketUpdate({
      ...ticket,
      isLoadingCopilot: true
    });

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticketId-1}/solve`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      onTicketUpdate({
        ...ticket,
        isLoadingCopilot: false,
        copilotResponse: data.response
      });
    } catch (error) {
      console.error('Error calling Copilot:', error);
      onTicketUpdate({
        ...ticket,
        isLoadingCopilot: false,
        copilotResponse: 'Error: Failed to get Copilot response'
      });
    }
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

  const handleChatOpen = (ticketId: number) => {
    setActiveChatTicketId(ticketId);
  };

  const handleChatClose = () => {
    setActiveChatTicketId(null);
  };

  const handleUpdateChatHistory = (ticketId: number, history: { sender: 'user' | 'ai'; content: string }[]) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    onTicketUpdate({
      ...ticket,
      chatHistory: history
    });
  };

  return (
    <>
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
            onCopilot={handleCopilot}
            onChatOpen={handleChatOpen}
          />
        ))}
      </div>
      {activeChatTicketId && (
        <ChatPanel
          ticketId={activeChatTicketId}
          initialContext={tickets.find(t => t.id === activeChatTicketId)?.copilotResponse || ''}
          chatHistory={tickets.find(t => t.id === activeChatTicketId)?.chatHistory || []}
          onClose={handleChatClose}
          onUpdateHistory={(history) => handleUpdateChatHistory(activeChatTicketId, history)}
        />
      )}
    </>
  );
};

export default TicketCanvas; 