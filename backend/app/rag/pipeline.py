from app.rag.loader import load_documents
from app.rag.chunker import chunk_text
from app.rag.embedder import Embedder
from app.rag.vector_store import VectorStore


class RAGPipeline:

    def __init__(self, knowledge_path: str):

        self.embedder = Embedder()

        documents = load_documents(knowledge_path)

        self.chunks = []

        for document in documents:

            chunks = chunk_text(
                document["text"]
            )

            for chunk in chunks:

                self.chunks.append({
                    "text": chunk,
                    "source": document["source"]
                })

        texts = [
            chunk["text"]
            for chunk in self.chunks
        ]

        vectors = self.embedder.embed(texts)

        self.vector_store = VectorStore(
            dimension=vectors.shape[1]
        )

        self.vector_store.add(
            vectors,
            self.chunks
        )

    def search(self, query: str, top_k=3):

        query_vector = self.embedder.embed(
            [query]
        )

        return self.vector_store.search(
            query_vector,
            top_k
        )