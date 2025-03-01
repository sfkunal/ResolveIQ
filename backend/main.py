from flask import Flask, request, jsonify
from flask_cors import CORS
import engine
from typing import Optional
import json

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
    
    def refresh_vectorstore(self):
        """Reload the vector store to incorporate newly added resolved tickets"""
        self._vectorstore = engine.load_knowledge_base()
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
        response_content, reference, source_type = engine.generate_response(
            ticket_string,
            relevant_knowledge[0],
            ticket_author
        )
        
        return jsonify({
            "ticket": ticket,
            "response": response_content,
            "reference": reference,  # Include the reference in the response
            "source_type": source_type,  # Include the source type (knowledge_wiki or resolved_ticket)
            "relevant_knowledge": relevant_knowledge[0][0]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tickets/<int:ticket_id>/resolve', methods=['POST'])
def mark_ticket_resolved(ticket_id):
    try:
        data = request.json
        solution = data.get('solution')
        resolved_by = data.get('resolved_by')
        
        if not solution:
            return jsonify({"error": "Missing solution for resolved ticket"}), 400
            
        # Get the ticket details
        ticket = engine.get_ticket(ticket_id)
        if not ticket:
            return jsonify({"error": f"Ticket {ticket_id} not found"}), 404
            
        # Add resolved ticket to the database
        engine.add_resolved_ticket(ticket, solution, resolved_by or ticket['author'])
        
        # Refresh the vector store to include the new resolved ticket
        kb_manager.refresh_vectorstore()
        
        return jsonify({
            "success": True,
            "message": f"Ticket {ticket_id} marked as resolved and added to knowledge base"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tickets/<int:ticket_id>/feedback', methods=['POST'])
def submit_solution_feedback(ticket_id):
    try:
        data = request.json
        was_helpful = data.get('helpful', False)
        
        # Update solution effectiveness
        updated = engine.update_solution_effectiveness(ticket_id, was_helpful)
        
        if updated:
            # Refresh the vector store to update the effectiveness scores
            kb_manager.refresh_vectorstore()
            
            return jsonify({
                "success": True,
                "message": f"Feedback for ticket {ticket_id} recorded successfully"
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Ticket {ticket_id} not found in resolved tickets"
            }), 404
            
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

        # get ticket by id
        ticket = engine.get_ticket(ticket_id)
        if not ticket:
            return jsonify({"error": f"Ticket {ticket_id} not found"}), 404
            
        ticket_string = engine.stringify_ticket(ticket)
        
        # Find relevant knowledge
        relevant_knowledge = engine.find_relevant_knowledge(
            ticket_string + "\n" + message, 
            kb_manager.vectorstore
        )
        
        # Generate response with chat history and author
        response_content, reference, source_type = engine.generate_response(
            ticket_string + "\nUser message: " + message,
            relevant_knowledge[0],
            ticket['author'],  # Pass the author
            chat_history
        )
        
        return jsonify({
            "response": response_content,
            "reference": reference,
            "source_type": source_type,
            "relevant_knowledge": relevant_knowledge[0][0]
        })
    except Exception as e:
        print(f"Error in chat: {str(e)}")  # logging stuff
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)