from app.rag.chunker import chunk_text


def test_chunk_text():
    text = "hello " * 1000

    chunks = chunk_text(text, chunk_size=100)

    assert len(chunks) == 10