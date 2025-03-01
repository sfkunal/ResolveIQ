import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import knowledgeWiki from './knowledge_wiki.md';

interface KnowledgeWikiProps {
  highlightedSection?: string;
}

const KnowledgeWiki: React.FC<KnowledgeWikiProps> = ({ highlightedSection }) => {
  const [wikiContent, setWikiContent] = useState('');
  const wikiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(knowledgeWiki)
      .then(response => response.text())
      .then(text => {
        setWikiContent(text);
        console.log("Wiki content loaded successfully");
      })
      .catch(error => console.error('Error loading wiki:', error));
  }, []);

  // highlight only on section change
  useEffect(() => {
    if (!highlightedSection || !wikiRef.current) return;

    console.log("Attempting to highlight:", highlightedSection);
    

    const h3Elements = wikiRef.current.querySelectorAll('h3');
    

    h3Elements.forEach(el => {
      el.classList.remove('highlighted-title');
    });
    
    // h3s with da highlighted section text
    let found = false;
    h3Elements.forEach(el => {
      if (el.textContent && el.textContent.includes(highlightedSection)) {
        console.log("Found matching element:", el.textContent);
        el.classList.add('highlighted-title');
        
        // scroll to element
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        found = true;
      }
    });
    
    if (!found) {
      console.log("No matching heading found for:", highlightedSection);
    }
    
    // remove  after 3 secs
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