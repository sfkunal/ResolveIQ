from flask import Flask, request, jsonify
from flask_cors import CORS
import engine
from typing import Optional
import json
import config

app = Flask(__name__)
CORS(app)

class KnowledgeBaseManager:
    _instance: Optional['KnowledgeBaseManager'] = None
    _vectorstore = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(KnowledgeBaseManager, cls).__new__(cls)
            cls._instance._vectorstore = engine.load_knowledge_base()
        return cls._instance

    @property
    def vectorstore(self):
        return self._vectorstore

kb_manager = KnowledgeBaseManager()

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    try:
        tickets = engine.get_tickets()
        return jsonify(tickets)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tickets/<int:ticket_id>/solve', methods=['POST'])
def solve_ticket(ticket_id):
    try:
        ticket = engine.get_ticket(ticket_id)
        ticket_string = engine.stringify_ticket(ticket)
        ticket_author = ticket['author']
        relevant_knowledge, has_knowledge_gap = engine.find_relevant_knowledge(
            ticket_string, 
            kb_manager.vectorstore
        )
        
        response_content, reference = engine.generate_response(
            ticket_string,
            relevant_knowledge[0] if relevant_knowledge else None,
            ticket_author
        )
        response = jsonify({
            "ticket": ticket,
            "response": response_content,
            "reference": reference,
            "relevant_knowledge": relevant_knowledge[0][0] if relevant_knowledge else None,
            "hasKnowledgeGap": has_knowledge_gap
        })
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        ticket_id = data.get('ticketId')
        message = data.get('message')
        chat_history = data.get('chatHistory', [])
        
        if not ticket_id or not message:
            return jsonify({"error": "Missing ticketId or message"}), 400

        ticket = engine.get_ticket(ticket_id)
        if not ticket:
            return jsonify({"error": f"Ticket {ticket_id} not found"}), 404
            
        ticket_string = engine.stringify_ticket(ticket)
        
        relevant_knowledge = engine.find_relevant_knowledge(
            ticket_string + "\n" + message, 
            kb_manager.vectorstore
        )
        
        response_content, reference = engine.generate_response(
            ticket_string + "\nUser message: " + message,
            relevant_knowledge[0],
            ticket['author'], 
            chat_history
        )
        
        return jsonify({
            "response": response_content,
            "reference": reference,
            "relevant_knowledge": relevant_knowledge[0][0]
        })
    except Exception as e:
        print(f"Error in chat: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/config/llm', methods=['GET'])
def get_llm_config():
    """Return the current LLM configuration"""
    return jsonify({
        "use_openai": config.USE_OPENAI,
        "model": config.OPENAI_MODEL if config.USE_OPENAI else config.OLLAMA_MODEL,
        "use_openai_embeddings": config.USE_OPENAI_EMBEDDINGS,
        "embedding_model": config.OPENAI_EMBEDDING_MODEL if config.USE_OPENAI_EMBEDDINGS else config.HUGGINGFACE_EMBEDDING_MODEL
    })

@app.route('/api/config/llm', methods=['POST'])
def update_llm_config():
    """Update the LLM configuration (requires server restart to take effect)"""
    try:
        data = request.json
        
        if 'use_openai' in data:
            config.USE_OPENAI = data['use_openai']
        
        if 'openai_model' in data and config.USE_OPENAI:
            config.OPENAI_MODEL = data['openai_model']
            
        if 'ollama_model' in data and not config.USE_OPENAI:
            config.OLLAMA_MODEL = data['ollama_model']
            
        if 'use_openai_embeddings' in data:
            config.USE_OPENAI_EMBEDDINGS = data['use_openai_embeddings']
            
        if 'openai_embedding_model' in data and config.USE_OPENAI_EMBEDDINGS:
            config.OPENAI_EMBEDDING_MODEL = data['openai_embedding_model']
            
        if 'huggingface_embedding_model' in data and not config.USE_OPENAI_EMBEDDINGS:
            config.HUGGINGFACE_EMBEDDING_MODEL = data['huggingface_embedding_model']
        
        engine.ChatModel._instance = None
        
        return jsonify({
            "message": "Configuration updated. Note that some changes may require a server restart to take full effect.",
            "current_config": {
                "use_openai": config.USE_OPENAI,
                "model": config.OPENAI_MODEL if config.USE_OPENAI else config.OLLAMA_MODEL,
                "use_openai_embeddings": config.USE_OPENAI_EMBEDDINGS,
                "embedding_model": config.OPENAI_EMBEDDING_MODEL if config.USE_OPENAI_EMBEDDINGS else config.HUGGINGFACE_EMBEDDING_MODEL
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/knowledge/add', methods=['POST'])
def add_knowledge():
    try:
        data = request.json
        solution = data.get('solution')
        ticket_title = data.get('ticketTitle')
        
        if not solution or not ticket_title:
            return jsonify({"error": "Missing required fields"}), 400
            
        new_section = engine.add_knowledge_to_wiki(ticket_title, solution)
        
        kb_manager._vectorstore = engine.load_knowledge_base()
        
        return jsonify({
            "success": True,
            "message": "Knowledge added successfully",
            "newSection": new_section
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/knowledge/wiki', methods=['GET'])
def get_knowledge_wiki():
    try:
        with open('knowledge_wiki.md', 'r') as f:
            content = f.read()
        return jsonify({'content': content})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
