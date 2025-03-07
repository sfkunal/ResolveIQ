import json
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
import markdown
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
import sqlite3
import psycopg2
from dotenv import load_dotenv
import os
from psycopg2.extras import RealDictCursor


def get_tickets():
    with open('support_tickets.json', 'r') as file:
        data = json.load(file)
        return data['tickets']  # only return tickets array bruh


def get_ticket(ticket_id):
    with open('support_tickets.json', 'r') as file:
        data = json.load(file)
        # find ticket by id instead of array index
        for ticket in data['tickets']:
            if ticket['id'] == ticket_id:
                return ticket
        return None

def stringify_ticket(ticket):
    return f"Title: {ticket['title']}\nDescription: {ticket['description']}"

def load_knowledge_base():
    with open('knowledge_wiki.md', 'r') as file:
        kb_content = file.read()
    
    chunks = [chunk.strip() for chunk in kb_content.split('###') if chunk.strip()]
    
    clean_chunks = []
    titles = []  # stores the sectoin titles for references
    
    for chunk in chunks:
        sections = chunk.split('\n', 1)
        title = sections[0].strip() if len(sections) > 1 else "Untitled"
        titles.append(title)
        content = sections[1].strip() if len(sections) > 1 else sections[0]
        html = markdown.markdown(content)
        clean_text = html.replace('<strong>', '').replace('</strong>', '') \
                        .replace('<p>', '').replace('</p>', '') \
                        .replace('<h3>', '').replace('</h3>', '') \
                        .replace('<ol>', '').replace('</ol>', '') \
                        .replace('<li>', '').replace('</li>', '')
        clean_chunks.append(clean_text)
    
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_texts(
        clean_chunks,
        embeddings,
        metadatas=[{"chunk_id": i, "title": titles[i], "source": "knowledge_wiki"} for i in range(len(clean_chunks))]
    )
    return vectorstore

def find_relevant_knowledge(ticket_string, vectorstore, top_k=3):
    relevant_chunks = vectorstore.similarity_search(ticket_string, k=top_k)
    return [(doc.page_content, doc.metadata) for doc in relevant_chunks]

class ChatModel:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChatModel, cls).__new__(cls)
            cls._instance._model = ChatOllama(model="llama3.2:3b")
        return cls._instance

    @property
    def model(self):
        return self._model
    
class EmployeeDatabase:

    def __init__(self):
        self._init_connection_params()
    
    def _init_connection_params(self):
        # Get connection parameters from environment variables
        load_dotenv()

        self.db_host = os.getenv("POSTGRES_HOST")
        self.db_name = os.getenv("POSTGRES_DB")
        self.db_user = os.getenv("POSTGRES_USER")
        self.db_password = os.getenv("POSTGRES_PASSWORD")
        self.db_port = os.getenv("POSTGRES_PORT", "5432")
        
        # Check if all required environment variables are set
        required_vars = ["POSTGRES_HOST", "POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    def get_connection(self):
        """Create and return a connection to the PostgreSQL database"""
        return psycopg2.connect(
            host=self.db_host,
            database=self.db_name,
            user=self.db_user,
            password=self.db_password,
            port=self.db_port
        )
    
    def execute_query(self, query, params=None):
        """Execute a SQL query and return the results"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()

def generate_response(ticket_string, relevant_knowledge, employee_name, chat_history=None):
    chat_model = ChatModel().model
    db = EmployeeDatabase()

    sql_query = """
    SELECT timezone, country, support_region, skills, line_of_business, manager, email, language, status, product, name 
    FROM employees 
    WHERE name = %s"""

    employee_data = db.execute_query(sql_query, (employee_name,))
    
    employee_info = {"No employee information found"}  # Default in case of no data
    
    if employee_data and len(employee_data) > 0:
        # With RealDictCursor, we get a dict-like object
        employee_info = employee_data[0]
    
    content, metadata = relevant_knowledge  # Unpack content and metadata from relevant_knowledge

    # Build conversation history
    messages = [
        SystemMessage(content=f"""You are a support assistant crafting personalized solutions by weaving knowledge base guidance with specific employee details.

For EACH instruction step:
1. Start with the knowledge base steps as your foundation
2. Directly incorporate relevant employee-specific details INTO the instruction text
3. Reference current values/settings when applicable (e.g., "change from X to Y")
4. Only include employee details that directly impact that particular step

Your solution should:
- Seamlessly blend knowledge base steps with employee details
- Use specific employee details rather than generic instructions ONLY when applicable
- Transform generic steps into personalized guidance
- Make current values (employee details) and needed changes explicit 
- Feel like instructions written specifically for this employee

Do not:
- Separate employee details from the actual instructions
- Add instructions not supported by the knowledge base
- Reference employee details that aren't relevant to the specific issue

If there are employee details relevant to the support ticket context, make each step uniquely tailored to this employee's details by directly weaving their specific details into the instruction language itself."""),
        
        HumanMessage(content=f"""Support Ticket:
{ticket_string}

Knowledge Base Section:
{content}

References: {metadata['title']}

Employee Details:
{json.dumps(employee_info, indent=2)}

Provide a concise step by step solution to the support ticket.""")
    ]

    # Add chat history if it exists
    if chat_history:
        for msg in chat_history:
            if msg['sender'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg['sender'] == 'ai':
                messages.append(HumanMessage(content=msg['content'], role="assistant"))
    
    response = chat_model.invoke(messages)
    # returns content and title of relevant section as well
    return response.content, metadata['title']


# is this being used for anything? can we delete? - nathan
def solve_ticket(ticket_index):
    vectorstore = load_knowledge_base()
    
    ticket = get_ticket(ticket_index)
    ticket_string = stringify_ticket(ticket)
    relevant_knowledge = find_relevant_knowledge(ticket_string, vectorstore)
    response = generate_response(ticket_string, relevant_knowledge[0])

    return response
