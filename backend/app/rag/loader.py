from pathlib import Path


def load_documents(directory: str):
    documents = []

    directory_path = Path(directory)

    for file_path in directory_path.rglob("*.md"):
        text = file_path.read_text(encoding="utf-8")

        documents.append({
            "source": str(file_path),
            "text": text
        })

    return documents