import json
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
import markdown
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
import sqlite3

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
            cls._instance._model = ChatOllama(model="llama3.2:1b")
        return cls._instance

    @property
    def model(self):
        return self._model
    
class EmployeeDatabase:

    def __init__(self, db_path="employee_support.db"):
        self.db_path = db_path
        self.setup_database()
        self.populate_table()

    def get_connection(self):
        return sqlite3.connect(self.db_path)
    
    def setup_database(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DROP TABLE IF EXISTS employees")
            cursor.execute("""
                           CREATE TABLE IF NOT EXISTS employees (
                            alias TEXT PRIMARY KEY,
                            timezone TEXT,
                            country TEXT,
                            support_region TEXT,
                            skills TEXT,
                            line_of_business TEXT,
                            manager TEXT,
                            email TEXT,
                            language TEXT,
                            status TEXT,
                            product TEXT,
                            name TEXT)
                           """)
            conn.commit()
    
    def populate_table(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            sample_employees = [
                {
                    "alias": "jsmith",
                    "timezone": "EST",
                    "country": "United States",
                    "support_region": "Americas",
                    "skills": json.dumps(["Troubleshooting", "Technical Writing", "Cloud Infrastructure"]),
                    "line_of_business": "Enterprise",
                    "manager": "mwilson",
                    "email": "john.smith@company.com",
                    "language": json.dumps(["English", "Spanish"]),
                    "status": "Active",
                    "product": "Cloud Platform",
                    "name": "John Smith"
                },
                {
                    "alias": "agarcia",
                    "timezone": "PST",
                    "country": "United States",
                    "support_region": "Americas",
                    "skills": json.dumps(["Database Management", "Performance Tuning", "Security"]),
                    "line_of_business": "SMB",
                    "manager": "mwilson",
                    "email": "ana.garcia@company.com",
                    "language": json.dumps(["English", "Spanish", "Portuguese"]),
                    "status": "Active",
                    "product": "Database Solutions",
                    "name": "Ana Garcia"
                },
                {
                    "alias": "tkumar",
                    "timezone": "IST",
                    "country": "India",
                    "support_region": "APAC",
                    "skills": json.dumps(["API Integration", "Mobile Development", "Backend Systems"]),
                    "line_of_business": "Enterprise",
                    "manager": "rpatel",
                    "email": "tej.kumar@company.com",
                    "language": json.dumps(["English", "Hindi", "Telugu"]),
                    "status": "Active",
                    "product": "API Gateway",
                    "name": "Tej Kumar"
                },
                {
                    "alias": "lwang",
                    "timezone": "CST",
                    "country": "China",
                    "support_region": "APAC",
                    "skills": json.dumps(["Machine Learning", "Data Analytics", "Cloud Architecture"]),
                    "line_of_business": "Enterprise",
                    "manager": "yzhan",
                    "email": "li.wang@company.com",
                    "language": json.dumps(["English", "Mandarin", "Cantonese"]),
                    "status": "Active",
                    "product": "ML Platform",
                    "name": "Li Wang"
                },
                {
                    "alias": "mmueller",
                    "timezone": "CET",
                    "country": "Germany",
                    "support_region": "EMEA",
                    "skills": json.dumps(["Security", "Compliance", "Network Infrastructure"]),
                    "line_of_business": "Enterprise",
                    "manager": "kschmidt",
                    "email": "max.mueller@company.com",
                    "language": json.dumps(["English", "German", "French"]),
                    "status": "Active",
                    "product": "Security Suite",
                    "name": "Max Mueller"
                },
                {
                    "alias": "slee",
                    "timezone": "KST",
                    "country": "South Korea",
                    "support_region": "APAC",
                    "skills": json.dumps(["Mobile Development", "Frontend Development", "UX Design"]),
                    "line_of_business": "SMB",
                    "manager": "jkim",
                    "email": "sun.lee@company.com",
                    "language": json.dumps(["English", "Korean", "Japanese"]),
                    "status": "Training",
                    "product": "Mobile SDK",
                    "name": "Sun Lee"
                },
                {
                    "alias": "olivia",
                    "timezone": "GMT",
                    "country": "United Kingdom",
                    "support_region": "EMEA",
                    "skills": json.dumps(["Product Management", "Technical Support", "Customer Success"]),
                    "line_of_business": "Enterprise",
                    "manager": "robert",
                    "email": "olivia.brown@company.com",
                    "language": json.dumps(["English", "French"]),
                    "status": "Active",
                    "product": "Enterprise Suite",
                    "name": "Olivia Brown"
                },
                {
                    "alias": "rpatel",
                    "timezone": "IST",
                    "country": "India",
                    "support_region": "APAC",
                    "skills": json.dumps(["Team Leadership", "Strategy", "Technical Architecture"]),
                    "line_of_business": "Enterprise",
                    "manager": "sarah",
                    "email": "raj.patel@company.com",
                    "language": json.dumps(["English", "Hindi", "Gujarati"]),
                    "status": "Active",
                    "product": "All Products",
                    "name": "Raj Patel"
                }
            ]
            cursor.executemany("""
                               INSERT INTO employees (alias, timezone, country, support_region, skills, line_of_business, manager, email, language, status, product, name)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                               """, [(emp["alias"], emp["timezone"], emp["country"], emp["support_region"],
                                    emp["skills"], emp["line_of_business"], emp["manager"], emp["email"],
                                    emp["language"], emp["status"], emp["product"], emp["name"]) 
                                    for emp in sample_employees])
            conn.commit()
            
    
    def is_table_empty(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM employees")
            count = cursor.fetchone()[0]
            return count == 0
        
    def execute_query(self, query):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            output = cursor.fetchall()
            return output

def generate_response(ticket_string, relevant_knowledge_list, employee_name, chat_history=None):
    chat_model = ChatModel().model
    db = EmployeeDatabase()

    sql_query = f"""
    SELECT timezone, country, support_region, skills, line_of_business, manager, email, language, status, product, name 
    FROM employees 
    WHERE name = ?"""

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql_query, (employee_name,))
        employee_data = cursor.fetchone()
    
    employee_info = {"No employee information found"}  # Default in case of no data
    
    if employee_data:
        employee_info = {
            "timezone": employee_data[0],
            "country": employee_data[1],
            "support_region": employee_data[2],
            "skills": json.loads(employee_data[3]),
            "line_of_business": employee_data[4],
            "manager": employee_data[5],
            "email": employee_data[6],
            "language": json.loads(employee_data[7]),
            "status": employee_data[8],
            "product": employee_data[9],
            "name": employee_data[10]
        }

    # Combine knowledge chunks but keep track of them separately
    combined_content = []
    knowledge_sections = {}  # Map titles to content for reference
    for content, metadata in relevant_knowledge_list:
        combined_content.append(content)
        knowledge_sections[metadata['title']] = content

    messages = [
        SystemMessage(content=f"""You are a support assistant providing solutions that meaningfully integrate knowledge base guidance with employee context. Follow this structure:

1. Review the ticket and identify:
   - The core issue to be solved
   - Key knowledge base instructions that are relevant
   - Employee attributes that directly impact the solution

2. Provide a tailored solution that:
   - Uses knowledge base steps as the foundation
   - Adapts each step based on the employee's specific situation
   - Only mentions employee attributes when explaining HOW they affect the implementation
   - Cites the specific knowledge base section used with [Section Name] at the end of each relevant step

3. Each step should demonstrate WHY and HOW employee attributes affect the implementation

4. Only cite knowledge base sections that directly contribute to the solution steps.

Do not:
- Simply list employee attributes without explaining their impact
- Include employee information that doesn't change how the solution is implemented
- Add generic steps that aren't supported by the knowledge base
- Cite sections that weren't directly used in the solution"""),
        
        HumanMessage(content=f"""Support Ticket:
{ticket_string}

Available Knowledge Base Sections:
{'\n\n'.join(combined_content)}

Knowledge Base Section Names:
{', '.join(knowledge_sections.keys())}

Employee Information:
{json.dumps(employee_info, indent=2)}

Provide a concise step by step solution addressing all relevant aspects of the support ticket.""")
    ]

    # Add chat history if it exists
    if chat_history:
        for msg in chat_history:
            if msg['sender'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg['sender'] == 'ai':
                messages.append(HumanMessage(content=msg['content'], role="assistant"))
    
    response = chat_model.invoke(messages)
    
    # Parse response to find actually used references
    used_references = []
    for title in knowledge_sections.keys():
        if f"[{title}]" in response.content:
            used_references.append(title)
    
    return response.content, used_references


# is this being used for anything? can we delete? - nathan
def solve_ticket(ticket_index):
    vectorstore = load_knowledge_base()
    
    ticket = get_ticket(ticket_index)
    ticket_string = stringify_ticket(ticket)
    relevant_knowledge = find_relevant_knowledge(ticket_string, vectorstore)
    response = generate_response(ticket_string, relevant_knowledge[0])

    return response
