import os
import io
import asyncio
import google.generativeai as genai
from pathlib import Path
from typing import List, Dict, Any, Optional
import PyPDF2
from docx import Document
from src.supabase_client import supabase
from src.ai_config import genai

# Configure embedding model
EMBEDDING_MODEL = "models/text-embedding-004"

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from a PDF file content (bytes)"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_word(file_content: bytes) -> str:
    """Extract text from a Word (.docx) file content (bytes)"""
    try:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"Error reading Word file: {e}")
        return ""

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into chunks with overlap"""
    if not text:
        return []
    
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap
        
    return chunks

async def generate_embedding(text: str) -> List[float]:
    """Generate embedding for a text string using Google GenAI"""
    try:
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []

async def process_document(user_id: str, document_id: str, purpose: str = "chat"):
    """
    Full pipeline: Download -> Extract -> Chunk -> Embed -> Save
    purpose: 'chat' (user_documents) or 'test' (test_materials)
    """
    try:
        # 1. Determine tables based on purpose
        if purpose == "chat":
            meta_table = "user_documents"
            chunk_table = "document_chunks"
            fk_col = "document_id"
        else:
            meta_table = "test_materials"
            chunk_table = "test_material_chunks"
            fk_col = "material_id"

        # 2. Get document metadata
        response = supabase.table(meta_table).select("*").eq("id", document_id).single().execute()
        if not response.data:
            raise ValueError(f"Document {document_id} not found in {meta_table}")
        
        doc_record = response.data
        source_path = doc_record["source_path"]
        file_name = doc_record["file_name"]
        
        print(f"Processing {file_name} ({purpose})...")
        
        # 3. Download file from Storage
        # Assuming bucket is 'mathmentor-materials' as seen in frontend
        bucket_name = "mathmentor-materials"
        file_data = supabase.storage.from_(bucket_name).download(source_path)
        
        # 4. Extract text
        ext = Path(file_name).suffix.lower()
        text = ""
        if ext == ".pdf":
            text = extract_text_from_pdf(file_data)
        elif ext in [".docx", ".doc"]:
            text = extract_text_from_word(file_data)
        else:
            # Try plain text
            try:
                text = file_data.decode('utf-8')
            except:
                print(f"Unsupported format: {ext}")
                return

        if not text:
            print("No text extracted")
            # Update status to failed
            supabase.table(meta_table).update({"rag_status": "failed"}).eq("id", document_id).execute()
            return

        # 5. Chunk text
        chunks = chunk_text(text)
        print(f"Generated {len(chunks)} chunks")
        
        # 6. Embed and Save Chunks
        # We'll do this in batches to avoid hitting rate limits or timeouts
        batch_size = 10
        
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i+batch_size]
            rows_to_insert = []
            
            # Create tasks for parallel embedding generation
            tasks = [generate_embedding(chunk) for chunk in batch]
            embeddings = await asyncio.gather(*tasks)
            
            for idx, chunk_content in enumerate(batch):
                real_index = i + idx
                embedding = embeddings[idx]
                
                if embedding:
                    rows_to_insert.append({
                        "user_id": user_id,
                        fk_col: document_id,
                        "chunk_index": real_index,
                        "content": chunk_content,
                        "content_length": len(chunk_content),
                        "source_path": source_path,
                        "embedding_status": "completed",
                        "embedding": embedding,
                        "visibility": doc_record.get("visibility", "private")
                    })
            
            if rows_to_insert:
                supabase.table(chunk_table).insert(rows_to_insert).execute()
                print(f"Saved batch {i//batch_size + 1}")

        # 7. Update document status
        supabase.table(meta_table).update({
            "rag_status": "ready",
            "chunk_count": len(chunks)
        }).eq("id", document_id).execute()
        
        print(f"Successfully processed {file_name}")
        return True

    except Exception as e:
        print(f"Error processing document: {e}")
        # Update status to failed
        try:
            supabase.table(meta_table).update({"rag_status": "failed"}).eq("id", document_id).execute()
        except:
            pass
        return False

async def search_similar_documents(query: str, user_id: str, purpose: str = "chat", limit: int = 5) -> List[Dict]:
    """
    Search for similar documents using vector similarity
    """
    try:
        # 1. Generate query embedding
        query_embedding = await generate_embedding(query)
        if not query_embedding:
            return []
        
        # 2. Call RPC function
        rpc_name = "match_documents" if purpose == "chat" else "match_test_materials"
        
        params = {
            "query_embedding": query_embedding,
            "match_threshold": 0.5, # Adjust threshold as needed
            "match_count": limit,
            "p_user_id": user_id
        }
        
        response = supabase.rpc(rpc_name, params).execute()
        return response.data if response.data else []
        
    except Exception as e:
        print(f"Error searching documents: {e}")
        return []
