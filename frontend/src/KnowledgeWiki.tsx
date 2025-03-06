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

  // Clear highlights function
  const clearHighlights = () => {
    if (highlightedElementsRef.current.length > 0) {
      highlightedElementsRef.current.forEach(element => {
        element.classList.remove('highlighted-section');
      });
      highlightedElementsRef.current = [];
    }
    highlightedSectionRef.current = null;
  };

  // Effect to scroll to and highlight the referenced section
  useEffect(() => {
    if (!activeReference || !wikiContentRef.current) return;

    // Clear previous timeout if exists
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    // Clear previous highlights
    clearHighlights();

    // Clean the reference string (remove ** and trim)
    const cleanReference = activeReference.replace(/\*\*/g, '').trim();
    
    // Find the heading that matches the reference
    const headings = wikiContentRef.current.querySelectorAll('h3');
    for (const heading of headings) {
      const headingText = heading.textContent?.replace(/\*\*/g, '').trim();
      
      if (headingText === cleanReference) {
        // Scroll to the heading
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight the section (heading and content until next heading)
        heading.classList.add('highlighted-section');
        highlightedSectionRef.current = heading;
        highlightedElementsRef.current.push(heading as HTMLElement);
        
        // Also highlight the content following the heading until the next heading
        let currentElement = heading.nextElementSibling;
        while (currentElement && currentElement.tagName !== 'H3') {
          currentElement.classList.add('highlighted-section');
          highlightedElementsRef.current.push(currentElement as HTMLElement);
          currentElement = currentElement.nextElementSibling;
        }
        
        // Set timeout to clear highlights after 5 seconds
        highlightTimeoutRef.current = window.setTimeout(() => {
          clearHighlights();
        }, 5000);
        
        break;
      }
    }

    // Cleanup function to clear timeout and highlights when component unmounts or reference changes
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