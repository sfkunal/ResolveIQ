import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import knowledgeWiki from './knowledge_wiki.md';

interface KnowledgeWikiProps {
  highlightedSection?: string;
}

const KnowledgeWiki: React.FC<KnowledgeWikiProps> = ({ highlightedSection }) => {
  const [wikiContent, setWikiContent] = useState('');
  const wikiRef = useRef<HTMLDivElement>(null);

  // Fetch the wiki content
  useEffect(() => {
    fetch(knowledgeWiki)
      .then(response => response.text())
      .then(text => {
        setWikiContent(text);
        console.log("Wiki content loaded successfully");
      })
      .catch(error => console.error('Error loading wiki:', error));
  }, []);

  // Apply highlighting when the section changes
  useEffect(() => {
    if (!highlightedSection || !wikiRef.current) return;

    console.log("Attempting to highlight:", highlightedSection);
    
    // Find all h3 elements in the wiki content
    const h3Elements = wikiRef.current.querySelectorAll('h3');
    
    // First, remove any existing highlighting
    h3Elements.forEach(el => {
      el.classList.remove('highlighted-title');
    });
    
    // Find the h3 that contains the highlighted section text
    let found = false;
    h3Elements.forEach(el => {
      if (el.textContent && el.textContent.includes(highlightedSection)) {
        console.log("Found matching element:", el.textContent);
        el.classList.add('highlighted-title');
        
        // Scroll to the element
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        found = true;
      }
    });
    
    if (!found) {
      console.log("No matching heading found for:", highlightedSection);
    }
    
    // Remove highlighting after a delay
    const timer = setTimeout(() => {
      h3Elements.forEach(el => {
        el.classList.remove('highlighted-title');
      });
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [highlightedSection]);

  return (
    <div className="knowledge-wiki">
      <h3>Knowledge Base</h3>
      <div className="wiki-content" ref={wikiRef}>
        <ReactMarkdown>{wikiContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default KnowledgeWiki;