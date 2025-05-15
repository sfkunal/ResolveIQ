import React, { useState } from 'react';

interface KnowledgeGapAlertProps {
    ticketTitle: string;
    onAddSolution: (solution: string) => Promise<void>;
}

const KnowledgeGapAlert: React.FC<KnowledgeGapAlertProps> = ({ ticketTitle, onAddSolution }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [solution, setSolution] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!solution.trim()) return;
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            await onAddSolution(solution);
            setSolution('');
            setIsExpanded(false);
        } catch (err) {
            setError('Failed to add solution. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="knowledge-gap-alert">
            <div className="alert-header" style={{ 
                backgroundColor: '#fee2e2', 
                padding: '12px 16px', 
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
            }}>
                <span role="img" aria-label="warning">⚠️</span>
                <span style={{ color: '#991b1b', fontWeight: 500 }}>
                    No relevant information found in knowledge base
                </span>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        marginLeft: 'auto',
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {isExpanded ? 'Hide' : 'Add Solution'}
                </button>
            </div>
            
            {isExpanded && (
                <div className="solution-form" style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                }}>
                    <textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder="Enter the solution that should be added to the knowledge base..."
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            padding: '12px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            marginBottom: '12px',
                            fontFamily: 'inherit'
                        }}
                    />
                    {error && (
                        <div style={{ 
                            color: '#dc2626', 
                            marginBottom: '12px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}
                    <button 
                        onClick={handleSubmit}
                        disabled={!solution.trim() || isSubmitting}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            opacity: (!solution.trim() || isSubmitting) ? 0.5 : 1
                        }}
                    >
                        {isSubmitting ? 'Saving...' : 'Save to Knowledge Base'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default KnowledgeGapAlert; 