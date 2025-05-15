import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface KnowledgeWikiProps {
  activeReference?: string;
  refreshTrigger?: number;
  hasRelevantInfo?: boolean;
}

const KnowledgeWiki: React.FC<KnowledgeWikiProps> = ({ 
  activeReference, 
  refreshTrigger = 0,
  hasRelevantInfo = true 
}) => {
  const [wikiContent, setWikiContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wikiContentRef = useRef<HTMLDivElement>(null);
  const highlightedSectionRef = useRef<HTMLElement | null>(null);
  const highlightedElementsRef = useRef<HTMLElement[]>([]);
  const highlightTimeoutRef = useRef<number | null>(null);

  const loadWikiContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/knowledge/wiki');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load knowledge wiki');
      }
      
      setWikiContent(data.content);
    } catch (error) {
      console.error('Error loading wiki:', error);
      setError(error instanceof Error ? error.message : 'Failed to load knowledge wiki');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWikiContent();
  }, [refreshTrigger]);

  const clearHighlights = () => {
    if (highlightedElementsRef.current.length > 0) {
      highlightedElementsRef.current.forEach(element => {
        element.classList.remove('highlighted-section');
      });
      highlightedElementsRef.current = [];
    }
    highlightedSectionRef.current = null;
  };

  useEffect(() => {
    if (!hasRelevantInfo || !activeReference || !wikiContentRef.current) {
      clearHighlights();
      return;
    }

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    clearHighlights();

    const cleanReference = activeReference.replace(/\*\*/g, '').trim();
    
    const headings = wikiContentRef.current.querySelectorAll('h3');
    for (const heading of headings) {
      const headingText = heading.textContent?.replace(/\*\*/g, '').trim();
      
      if (headingText === cleanReference) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        heading.classList.add('highlighted-section');
        highlightedSectionRef.current = heading;
        highlightedElementsRef.current.push(heading as HTMLElement);
        
        let currentElement = heading.nextElementSibling;
        while (currentElement && currentElement.tagName !== 'H3') {
          currentElement.classList.add('highlighted-section');
          highlightedElementsRef.current.push(currentElement as HTMLElement);
          currentElement = currentElement.nextElementSibling;
        }
        
        highlightTimeoutRef.current = window.setTimeout(() => {
          clearHighlights();
        }, 5000);
        
        break;
      }
    }

    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      clearHighlights();
    };
  }, [activeReference, wikiContent, hasRelevantInfo]);

  return (
    <div className="knowledge-wiki">
      <h3>Knowledge Base</h3>
      <div className="wiki-content" ref={wikiContentRef}>
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner" />
            <span>Loading knowledge base...</span>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
          </div>
        ) : (
          <ReactMarkdown>{wikiContent}</ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default KnowledgeWiki; 