"""
Metadata-aware Markdown Chunker for AcmeCommerce Knowledge Base.

Splits policies, FAQs, and runbooks by Markdown headers (#, ##, ###)
to preserve complete rules and semantic context, attaching document IDs
and metadata to each individual chunk.
"""

import re
from typing import Dict, List, Any


def split_into_sections(text: str) -> List[tuple[str, str]]:
    """
    Splits markdown text into (heading, section_text) pairs based on headers.
    """
    header_pattern = re.compile(r"^(#{1,3}\s+.+)$", re.MULTILINE)
    splits = header_pattern.split(text)

    sections = []
    current_heading = "Overview"
    
    # If text starts before first header
    first_part = splits[0].strip()
    if first_part:
        sections.append((current_heading, first_part))

    for i in range(1, len(splits), 2):
        heading = splits[i].strip("# ").strip()
        body = splits[i + 1].strip() if i + 1 < len(splits) else ""
        if body:
            sections.append((heading, body))

    return sections


def chunk_document(
    document: Dict[str, Any],
    max_words_per_chunk: int = 250,
    overlap_words: int = 40
) -> List[Dict[str, Any]]:
    """
    Chunks a single document preserving metadata and markdown sections.
    """
    metadata = document.get("metadata", {})
    doc_id = metadata.get("document_id", "DOC-UNKNOWN")
    domain = metadata.get("domain", "general")
    authority = metadata.get("authority", "explanatory")
    doc_type = metadata.get("document_type", "document")
    source = document.get("source", "")
    file_name = document.get("file_name", "")

    sections = split_into_sections(document.get("text", ""))
    chunks = []

    for heading, body in sections:
        words = body.split()
        if not words:
            continue

        if len(words) <= max_words_per_chunk:
            chunk_content = f"[{doc_id}] {heading}\n{body}"
            chunks.append({
                "text": chunk_content,
                "raw_text": body,
                "document_id": doc_id,
                "domain": domain,
                "authority": authority,
                "document_type": doc_type,
                "section": heading,
                "source": source,
                "file_name": file_name
            })
        else:
            # Sub-chunk with overlap for long sections
            step = max_words_per_chunk - overlap_words
            for start in range(0, len(words), step):
                chunk_slice = words[start:start + max_words_per_chunk]
                sub_body = " ".join(chunk_slice)
                chunk_content = f"[{doc_id}] {heading} (part)\n{sub_body}"
                chunks.append({
                    "text": chunk_content,
                    "raw_text": sub_body,
                    "document_id": doc_id,
                    "domain": domain,
                    "authority": authority,
                    "document_type": doc_type,
                    "section": heading,
                    "source": source,
                    "file_name": file_name
                })

    return chunks


def chunk_text(text: str, chunk_size: int = 250) -> List[str]:
    """
    Backward-compatible simple string chunker.
    """
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]