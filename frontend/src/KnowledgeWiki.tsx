import React from 'react';
import ReactMarkdown from 'react-markdown';
import knowledgeWiki from './knowledge_wiki.md';

const KnowledgeWiki: React.FC = () => {
  const [wikiContent, setWikiContent] = React.useState('');

  React.useEffect(() => {
    fetch(knowledgeWiki)
      .then(response => response.text())
      .then(text => setWikiContent(text))
      .catch(error => console.error('Error loading wiki:', error));
  }, []);

  return (
    <div className="knowledge-wiki">
      <h3>Knowledge Base</h3>
      <div className="wiki-content">
        <ReactMarkdown>{wikiContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default KnowledgeWiki; 