import engine

def main():
    ticket = engine.get_ticket(0)
    ticket_string = engine.stringify_ticket(ticket)
    print("ticket:", ticket_string)
    vectorstore = engine.load_knowledge_base()
    relevant_knowledge = engine.find_relevant_knowledge(ticket_string, vectorstore)
    print(relevant_knowledge[0])

main()
    # chat_model = ChatOllama(model="llama3.2:1b")
