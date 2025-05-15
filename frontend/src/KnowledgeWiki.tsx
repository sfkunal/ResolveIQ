import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import knowledgeWiki from './knowledge_wiki.md';

interface KnowledgeWikiProps {
  activeReference?: string;
}

const KnowledgeWiki: React.FC<KnowledgeWikiProps> = ({ activeReference }) => {
  const [wikiContent, setWikiContent] = useState('');
  const wikiContentRef = useRef<HTMLDivElement>(null);
  const highlightedSectionRef = useRef<HTMLElement | null>(null);
  const highlightedElementsRef = useRef<HTMLElement[]>([]);
  const highlightTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    fetch(knowledgeWiki)
      .then(response => response.text())
      .then(text => setWikiContent(text))
      .catch(error => console.error('Error loading wiki:', error));
  }, []);

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
    if (!activeReference || !wikiContentRef.current) return;

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
  }, [activeReference, wikiContent]);

  return (
    <div className="knowledge-wiki">
      <h3>Knowledge Base</h3>
      <div className="wiki-content" ref={wikiContentRef}>
        <ReactMarkdown>{wikiContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default KnowledgeWiki; 