"""
Document loader for AcmeCommerce Knowledge Base.

Loads Markdown files recursively and extracts YAML frontmatter metadata
(e.g., document_id, domain, authority, document_type) along with clean body text.
"""

from pathlib import Path
from typing import Dict, List, Any
import yaml


def extract_frontmatter(content: str) -> tuple[Dict[str, Any], str]:
    """
    Extracts YAML frontmatter from markdown content if present.
    Returns (metadata_dict, body_text).
    """
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1].strip()
            body_text = parts[2].strip()
            try:
                metadata = yaml.safe_load(fm_text) or {}
                return metadata, body_text
            except Exception:
                pass
    return {}, content.strip()


def get_default_metadata(file_path: Path) -> Dict[str, Any]:
    """
    Supplies default metadata for files lacking frontmatter (like RULES.md).
    """
    stem = file_path.stem.upper()
    if "RULES" in stem:
        return {
            "document_id": "RULES-001",
            "document_type": "policy_summary",
            "domain": "rules",
            "authority": "authoritative",
            "version": "1.0"
        }
    return {
        "document_id": f"DOC-{stem}",
        "document_type": "general",
        "domain": "general",
        "authority": "explanatory",
        "version": "1.0"
    }


def load_documents(directory: str) -> List[Dict[str, Any]]:
    """
    Loads all .md files in the directory recursively.
    Returns a list of document dicts with source, metadata, and text.
    """
    documents = []
    directory_path = Path(directory)

    # Exclude report or auxiliary files if desired, or load policies/faqs/runbooks
    for file_path in directory_path.rglob("*.md"):
        # Ignore audit report from RAG policy retrieval if needed
        if file_path.name in ["CONSISTENCY_REPORT.md"]:
            continue

        text = file_path.read_text(encoding="utf-8")
        metadata, body = extract_frontmatter(text)
        if not metadata:
            metadata = get_default_metadata(file_path)

        documents.append({
            "source": str(file_path).replace("\\", "/"),
            "file_name": file_path.name,
            "metadata": metadata,
            "text": body
        })

    return documents