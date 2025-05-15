import React, { useState, useRef, useEffect } from 'react';
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
  isFullscreen?: boolean;
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

const FullscreenTicket: React.FC<{
  ticket: Ticket;
  onClose: () => void;
  onRemove: (ticketId: number) => void;
  onCopilot: (ticketId: number) => void;
  onChatOpen: (ticketId: number) => void;
  onTicketUpdate: (updatedTicket: Ticket) => void;
}> = ({ ticket, onClose, onRemove, onCopilot, onChatOpen, onTicketUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(ticket.copilotResponse || '');
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  
  const handleStatusChange = (newStatus: string) => {
    onTicketUpdate({
      ...ticket,
      status: newStatus
    });
  };
  
  const cleanReference = (ref: string): string => {
    return ref.replace(/\*\*/g, '').trim();
  };
  
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div className="fullscreen-overlay" onClick={onClose}>
      <div className="fullscreen-modal" onClick={handleModalClick}>
        <div className="fullscreen-header">
          <button 
            className="fullscreen-close-btn"
            onClick={onClose}
            title="Exit fullscreen"
          >
            <span role="img" aria-label="exit fullscreen">⤓</span>
            Exit Fullscreen
          </button>
          
          <div className="fullscreen-title-section">
            <div className="title-content">
              <div className={`status-badge ${ticket.status.toLowerCase()}`}>
                {ticket.status}
              </div>
              <h2>{ticket.title}</h2>
            </div>
          </div>
        </div>
        
        <div className="fullscreen-action-bar">
          <div className="status-control">
            <button 
              className="ticket-status-btn"
              onClick={() => setShowStatusSelector(!showStatusSelector)}
              title="Change status"
              style={{ backgroundColor: '#3B82F6', color: 'white', padding: '10px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <svg className="status-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
              </svg>
              Status
            </button>
            {showStatusSelector && (
              <div className="status-selector">
                <button 
                  className={`status-option ${ticket.status === 'Open' ? 'active' : ''}`}
                  onClick={() => handleStatusChange('Open')}
                >
                  Open
                </button>
                <button 
                  className={`status-option ${ticket.status === 'In Progress' ? 'active' : ''}`}
                  onClick={() => handleStatusChange('In Progress')}
                >
                  In Progress
                </button>
                <button 
                  className={`status-option ${ticket.status === 'Resolved' ? 'active' : ''}`}
                  onClick={() => handleStatusChange('Resolved')}
                >
                  Resolved
                </button>
              </div>
            )}
          </div>
          
          {!ticket.copilotResponse && (
            <button 
              className="ticket-copilot-btn"
              onClick={() => onCopilot(ticket.id)}
              disabled={ticket.isLoadingCopilot}
              title="Activate Copilot"
              style={{ backgroundColor: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              {ticket.isLoadingCopilot ? (
                <>
                  <div className="spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="copilot-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                  Activate Copilot
                </>
              )}
            </button>
          )}
          
          {ticket.copilotResponse && (
            <button 
              className="ticket-chat-btn"
              onClick={() => onChatOpen(ticket.id)}
              title="Open chat"
              style={{ backgroundColor: '#10B981', color: 'white', padding: '10px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <svg className="chat-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              Chat
            </button>
          )}
        </div>
        
        <div className="fullscreen-content">
          <div className="ticket-info-section">
            <h3>Description</h3>
            <p>{ticket.description}</p>
            <div className="ticket-meta">
              <span>Created by: {ticket.author}</span>
              <span>Date: {new Date(ticket.time).toLocaleDateString()}</span>
            </div>
          </div>
          
          {(ticket.copilotResponse || ticket.isLoadingCopilot) && (
            <div className="copilot-section">
              <h3>Copilot Response</h3>
              {ticket.isLoadingCopilot ? (
                <div className="loading-container">
                  <div className="spinner" />
                  <span>Getting Copilot response...</span>
                </div>
              ) : (
                <>
                  {!isEditing ? (
                    <div className="response-content">
                      <ReactMarkdown>{ticket.copilotResponse || ''}</ReactMarkdown>
                      <button 
                        className="edit-response-btn"
                        onClick={() => {
                          setIsEditing(true);
                          setEditedResponse(ticket.copilotResponse || '');
                        }}
                      >
                        Edit Response
                      </button>
                    </div>
                  ) : (
                    <div className="response-editor">
                      <textarea
                        value={editedResponse}
                        onChange={(e) => setEditedResponse(e.target.value)}
                        className="response-textarea"
                        placeholder="Edit copilot response"
                        aria-label="Edit copilot response"
                      />
                      <div className="editor-buttons">
                        <button
                          onClick={() => {
                            onTicketUpdate({
                              ...ticket,
                              copilotResponse: editedResponse
                            });
                            setIsEditing(false);
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditedResponse(ticket.copilotResponse || '');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {ticket.reference && (
            <div className="references-section">
              <h3>Knowledge Wiki References</h3>
              <div className="reference-list">
                {ticket.reference.split(',').map((ref, index) => (
                  <div key={index} className="reference-item">
                    <span className="reference-bullet">-</span> {cleanReference(ref)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TicketCard: React.FC<{
  ticket: Ticket;
  onPositionChange: (x: number, y: number) => void;
  onRemove: (ticketId: number) => void;
  onCopilot: (ticketId: number) => void;
  onChatOpen: (ticketId: number) => void;
  onTicketUpdate: (updatedTicket: Ticket) => void;
}> = ({ ticket, onPositionChange, onRemove, onCopilot, onChatOpen, onTicketUpdate }) => {
  const nodeRef = useRef<HTMLDivElement>(null!);
  const ticketRef = useRef<HTMLDivElement>(null!);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(ticket.copilotResponse || '');
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    onPositionChange(data.x, data.y);
  };

  const handleStatusChange = (newStatus: string) => {
    onTicketUpdate({
      ...ticket,
      status: newStatus
    });
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTicketUpdate({
      ...ticket,
      isFullscreen: !ticket.isFullscreen
    });
  };

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
      <div ref={nodeRef} style={{ position: 'absolute', width: 300, height: 'auto' }}>
          <div 
            className="canvas-ticket drag-handle"
            ref={ticketRef}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => {
              setShowControls(false);
              setShowStatusSelector(false);
            }}
          >
            {showControls && (
              <>
                <button 
                  className="ticket-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(ticket.id);
                  }}
                  title="Remove ticket"
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
                  title="Activate Copilot"
                >
                  {ticket.isLoadingCopilot ? (
                    <>
                      <div className="spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="copilot-icon" viewBox="0 0 24 24" width="20" height="20">
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
                    title="Open chat"
                  >
                    <svg className="chat-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                    Chat
                  </button>
                )}

                <div className="status-button-container">
                  <button 
                    className="ticket-status-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStatusSelector(!showStatusSelector);
                    }}
                    onMouseEnter={() => setShowStatusSelector(true)}
                    title="Change status"
                  >
                    <svg className="status-icon" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                    </svg>
                    Status
                  </button>
                  {showStatusSelector && (
                    <div className="status-selector">
                      <button 
                        className={`status-option ${ticket.status === 'Open' ? 'active' : ''}`}
                        onClick={() => handleStatusChange('Open')}
                        title="Set status to Open"
                      >
                        Open
                      </button>
                      <button 
                        className={`status-option ${ticket.status === 'In Progress' ? 'active' : ''}`}
                        onClick={() => handleStatusChange('In Progress')}
                        title="Set status to In Progress"
                      >
                        In Progress
                      </button>
                      <button 
                        className={`status-option ${ticket.status === 'Resolved' ? 'active' : ''}`}
                        onClick={() => handleStatusChange('Resolved')}
                        title="Set status to Resolved"
                      >
                        Resolved
                      </button>
                    </div>
                  )}
                </div>
              </>
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
            
            <button 
              className="fullscreen-toggle-btn"
              onClick={toggleFullscreen}
              title="View in fullscreen"
            >
              <span role="img" aria-label="fullscreen">⤢</span>
            </button>
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
                  {!isEditing ? (
                    <>
                      <ReactMarkdown>{ticket.copilotResponse || ''}</ReactMarkdown>
                      <button 
                        className="edit-response-btn"
                        onClick={() => {
                          setIsEditing(true);
                          setEditedResponse(ticket.copilotResponse || '');
                        }}
                      >
                        Edit Response
                      </button>
                    </>
                  ) : (
                    <div className="response-editor">
                      <textarea
                        value={editedResponse}
                        onChange={(e) => setEditedResponse(e.target.value)}
                        className="response-textarea"
                        placeholder="Edit copilot response"
                        aria-label="Edit copilot response"
                      />
                      <div className="editor-buttons">
                        <button
                          onClick={() => {
                            onTicketUpdate({
                              ...ticket,
                              copilotResponse: editedResponse
                            });
                            setIsEditing(false);
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditedResponse(ticket.copilotResponse || '');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {ticket.reference && (
                    <div className="copilot-reference">
                      <h4 className="reference-title">Knowledge Wiki References</h4>
                      <div className="reference-list">
                        {ticket.reference.split(',').map((ref, index) => (
                          <div key={index} className="reference-item">
                            <span className="reference-bullet">-</span> {cleanReference(ref)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
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
  const [scale, setScale] = useState(1);
  
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
      const response = await fetch(`http://127.0.0.1:5000/api/tickets/${ticketId}/solve`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      onTicketUpdate({
        ...ticket,
        isLoadingCopilot: false,
        copilotResponse: data.response,
        reference: data.reference
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
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleFullscreenClose = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    onTicketUpdate({
      ...ticket,
      isFullscreen: false
    });
  };

  const fullscreenTicket = tickets.find(ticket => ticket.isFullscreen);

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
            onRemove={onTicketRemove}
            onCopilot={handleCopilot}
            onChatOpen={handleChatOpen}
            onTicketUpdate={onTicketUpdate}
          />
        ))}
      </div>
      
      {fullscreenTicket && (
        <FullscreenTicket
          ticket={fullscreenTicket}
          onClose={() => handleFullscreenClose(fullscreenTicket.id)}
          onRemove={onTicketRemove}
          onCopilot={handleCopilot}
          onChatOpen={handleChatOpen}
          onTicketUpdate={onTicketUpdate}
        />
      )}
      
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