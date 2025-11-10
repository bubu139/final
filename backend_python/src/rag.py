"""Utilities for retrieval-augmented generation with Supabase vector storage."""

from __future__ import annotations

import os
import uuid
from typing import Any, Dict, Iterable, List, Optional

from supabase import Client, create_client

from .ai_config import genai


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_VECTOR_TABLE = os.getenv("SUPABASE_VECTOR_TABLE", "documents")
SUPABASE_MATCH_FUNCTION = os.getenv("SUPABASE_MATCH_FUNCTION", "match_documents")

DEFAULT_CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "1200"))
DEFAULT_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "200"))
DEFAULT_MATCH_COUNT = int(os.getenv("RAG_MATCH_COUNT", "4"))


_supabase_client: Optional[Client] = None


def _get_supabase_client() -> Client:
    """Create (or return cached) Supabase client."""

    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Supabase credentials are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )

    _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client


def _embed_text(content: str, *, task_type: str) -> List[float]:
    """Create an embedding vector for a piece of text."""

    if not content.strip():
        return []

    response = genai.embed_content(
        model="models/text-embedding-004",
        content=content,
        task_type=task_type,
    )

    embedding = response.get("embedding")
    if not embedding:
        raise RuntimeError("Failed to compute embedding from Google Generative AI response")
    return embedding


def embed_document_chunk(content: str) -> List[float]:
    """Embed a document chunk for storage in the vector database."""

    return _embed_text(content, task_type="retrieval_document")


def embed_query(content: str) -> List[float]:
    """Embed a query for similarity search."""

    return _embed_text(content, task_type="retrieval_query")


def chunk_text(text: str, *, chunk_size: int = DEFAULT_CHUNK_SIZE, overlap: int = DEFAULT_CHUNK_OVERLAP) -> List[str]:
    """Split raw text into overlapping chunks for embedding."""

    if not text:
        return []

    cleaned = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    if not cleaned:
        return []

    chunks: List[str] = []
    start = 0
    length = len(cleaned)

    while start < length:
        end = min(start + chunk_size, length)
        chunk = cleaned[start:end]

        if end < length:
            # Try to break on paragraph/sentence boundaries for readability.
            split_candidates: Iterable[int] = (
                chunk.rfind("\n\n"),
                chunk.rfind(". "),
                chunk.rfind("; "),
            )
            split_index = max([idx for idx in split_candidates if idx != -1], default=-1)
            if split_index > chunk_size * 0.5:
                end = start + split_index + 1
                chunk = cleaned[start:end]

        chunks.append(chunk.strip())

        if end >= length:
            break

        start = max(0, end - overlap)

    return [c for c in chunks if c]


def ingest_document(
    *,
    document_id: str,
    title: str,
    text: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Chunk, embed, and upsert a document into the Supabase vector table."""

    chunks = chunk_text(text)
    if not chunks:
        return {"document_id": document_id, "chunks": 0, "token_estimate": 0}

    supabase = _get_supabase_client()

    rows = []
    total_tokens = 0
    base_metadata = metadata or {}

    for index, chunk in enumerate(chunks):
        embedding = embed_document_chunk(chunk)
        total_tokens += len(chunk.split())
        rows.append(
            {
                "id": str(uuid.uuid4()),
                "doc_id": document_id,
                "content": chunk,
                "metadata": {
                    **base_metadata,
                    "chunk_index": index,
                    "doc_title": title,
                },
                "embedding": embedding,
            }
        )

    response = supabase.table(SUPABASE_VECTOR_TABLE).upsert(rows).execute()
    if getattr(response, "error", None):
        raise RuntimeError(f"Failed to upsert document chunks: {response.error}")

    return {
        "document_id": document_id,
        "chunks": len(rows),
        "token_estimate": total_tokens,
    }


def retrieve_context(
    query: str,
    *,
    match_count: int = DEFAULT_MATCH_COUNT,
) -> List[Dict[str, Any]]:
    """Retrieve the most relevant document chunks for a query from Supabase."""

    if not query.strip():
        return []

    supabase = _get_supabase_client()
    query_embedding = embed_query(query)

    rpc_payload = {
        "query_embedding": query_embedding,
        "match_count": match_count,
    }

    response = supabase.rpc(SUPABASE_MATCH_FUNCTION, rpc_payload).execute()

    if getattr(response, "error", None):
        raise RuntimeError(f"Supabase match RPC failed: {response.error}")

    matches = getattr(response, "data", None)
    if matches is None:
        matches = response if isinstance(response, list) else []

    return [match for match in matches if isinstance(match, dict) and match.get("content")]
