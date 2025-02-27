from flask import Flask, request, jsonify
from flask_cors import CORS
import engine
from typing import Optional

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

# Initialize the knowledge base when the server starts
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
        # Get the ticket
        ticket = engine.get_ticket(ticket_id)
        ticket_string = engine.stringify_ticket(ticket)
        ticket_author = ticket['author']
        # Use the singleton vectorstore
        relevant_knowledge = engine.find_relevant_knowledge(
            ticket_string, 
            kb_manager.vectorstore
        )
        
        # Generate response
        response_content, reference = engine.generate_response(
            ticket_string,
            relevant_knowledge[0],
            ticket_author
        )
        
        return jsonify({
            "ticket": ticket,
            "response": response_content,
            "reference": reference,  # Include the reference in the response
            "relevant_knowledge": relevant_knowledge[0][0]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

        # Get the ticket context
        ticket = engine.get_ticket(ticket_id-1)
        ticket_string = engine.stringify_ticket(ticket)
        
        # Find relevant knowledge
        relevant_knowledge = engine.find_relevant_knowledge(
            ticket_string + "\n" + message, 
            kb_manager.vectorstore
        )
        
        # Generate response with chat history
        response = engine.generate_response(
            ticket_string + "\nUser message: " + message,
            relevant_knowledge[0],
            chat_history
        )
        
        return jsonify({
            "response": response,
            "relevant_knowledge": relevant_knowledge[0]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
