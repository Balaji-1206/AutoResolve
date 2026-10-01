from app.rag.pipeline import RAGPipeline


rag = RAGPipeline(
    "../knowledge"
)

question = "How long do refunds take?"

results = rag.search(
    question,
    top_k=3
)

for result in results:

    print("\nSOURCE:")
    print(result["document"]["source"])

    print("\nDISTANCE:")
    print(result["distance"])

    print("\nCONTENT:")
    print(result["document"]["text"])