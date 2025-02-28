import React, { useState, useRef } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
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
  size?: { width: number; height: number };
  copilotResponse?: string;
  reference?: string;
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
  onSizeChange: (width: number, height: number) => void;
  onRemove: (ticketId: number) => void;
  onCopilot: (ticketId: number) => void;
  onChatOpen: (ticketId: number) => void;
}> = ({ ticket, onPositionChange, onSizeChange, onRemove, onCopilot, onChatOpen }) => {
  const nodeRef = useRef<HTMLDivElement>(null!);
  
  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    onPositionChange(data.x, data.y);
  };

  const handleResize = (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
    onSizeChange(data.size.width, data.size.height);
  };

  // remove the markdown asterisks for references bruh
  const cleanReference = (ref: string): string => {
    return ref.replace(/\*\*/g, '').trim();
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={ticket.position || { x: 0, y: 0 }}
      onStop={handleDrag}
      bounds="parent"
      handle=".drag-handle"
    >
      <div ref={nodeRef} style={{ position: 'absolute', width: 'auto', height: 'auto' }}>
        <ResizableBox
          width={ticket.size?.width || 300}
          height={ticket.size?.height || 200}
          onResizeStop={handleResize}
          minConstraints={[200, 150]}
          maxConstraints={[500, 400]}
          resizeHandles={['se']}
        >
          <div className="canvas-ticket drag-handle">
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
              {ticket.isLoadingCopilot ? (
                <>
                  <div className="spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="copilot-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                  Activate Copilot
                </>
              )}
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
              {ticket.isLoadingCopilot ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <div className="spinner" style={{ borderColor: 'rgba(0, 0, 0, 0.2)', borderTopColor: '#666' }} />
                  <span style={{ marginLeft: '10px', color: '#666' }}>Getting Copilot response...</span>
                </div>
              ) : (
                <>
                  <ReactMarkdown>{ticket.copilotResponse || ''}</ReactMarkdown>
                  {ticket.reference && (
                    <div className="copilot-reference">
                      <h4 className="reference-title">Knowledge Wiki References</h4>
                      <div className="reference-list">
                        {ticket.reference.split(',').map((ref, index) => (
                          <div key={index} className="reference-item">
                            <span className="reference-bullet">•</span> 
                            {cleanReference(ref)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>
          )}
        </ResizableBox>
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
  const [scale, setScale] = useState(1);
  
  const handlePositionChange = (ticket: Ticket, x: number, y: number) => {
    onTicketUpdate({
      ...ticket,
      position: { x, y }
    });
  };

  const handleSizeChange = (ticket: Ticket, width: number, height: number) => {
    onTicketUpdate({
      ...ticket,
      size: { width, height }
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
      const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticketId}/solve`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      // Now references should be an array due to our backend changes
      onTicketUpdate({
        ...ticket,
        isLoadingCopilot: false,
        copilotResponse: data.response,
        reference: Array.isArray(data.references) 
          ? data.references.join(', ')  // Join array into comma-separated string
          : data.reference  // Fallback to single reference if old format
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

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2)); // Max zoom: 2x
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5)); // Min zoom: 0.5x
  };

  return (
    <div className="canvas-container">
      <div className="zoom-controls">
        <button 
          onClick={handleZoomIn} 
          className="zoom-button"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
          </svg>
        </button>
        <button 
          onClick={handleZoomOut} 
          className="zoom-button"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 13H5v-2h14v2z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div 
        className={`ticket-canvas ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onPositionChange={(x, y) => handlePositionChange(ticket, x, y)}
            onSizeChange={(width, height) => handleSizeChange(ticket, width, height)}
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
    </div>
  );
};

export default TicketCanvas;
