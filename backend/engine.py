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
    return data

def get_ticket(index):
    with open('support_tickets.json', 'r') as file:
        data = json.load(file)
    return data['tickets'][index]

def stringify_ticket(ticket):
    return f"Title: {ticket['title']}\nDescription: {ticket['description']}"

def load_knowledge_base():
    with open('knowledge_wiki.md', 'r') as file:
        kb_content = file.read()
    
    chunks = [chunk.strip() for chunk in kb_content.split('###') if chunk.strip()]
    
    clean_chunks = []
    for chunk in chunks:
        html = markdown.markdown(chunk)
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
        metadatas=[{"chunk_id": i, "source": "knowledge_wiki"} for i in range(len(clean_chunks))]
    )
    return vectorstore


def find_relevant_knowledge(ticket_string, vectorstore, top_k=3):
    relevant_chunks = vectorstore.similarity_search(ticket_string, k=top_k)
    return [doc.page_content for doc in relevant_chunks]

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

def generate_response(ticket_string, relevant_knowledge):
    chat_model = ChatModel().model
    messages = [
        SystemMessage(content="You are a helpful AI assistant. Use the relevant knowledge to solve the ticket."),
        HumanMessage(content="Ticket: " + ticket_string),
        HumanMessage(content="Relevant knowledge: " + relevant_knowledge)
    ]
    response = chat_model.invoke(messages)
    return response.content

def solve_ticket(ticket_index):
    vectorstore = load_knowledge_base()
    
    ticket = get_ticket(ticket_index)
    ticket_string = stringify_ticket(ticket)

    relevant_knowledge = find_relevant_knowledge(ticket_string, vectorstore)
    response = generate_response(ticket_string, relevant_knowledge[0])

    return response

