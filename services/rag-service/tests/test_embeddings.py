from app.rag.embedder import Embedder

embedder = Embedder()

text = "Customers can request a refund within 30 days."

vector = embedder.embed([text])

print("Vector shape:", vector.shape)
print("First 10 values:", vector[0][:10])