"""Shared helpers for reading and extracting text from files."""
from pathlib import Path
import PyPDF2
from docx import Document


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file path."""
    try:
        with open(pdf_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"Error reading PDF {pdf_path}: {exc}")
        return ""


def extract_text_from_word(docx_path: str) -> str:
    """Extract text from a Word (.docx) file path."""
    try:
        doc = Document(docx_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"Error reading Word file {docx_path}: {exc}")
        return ""


def extract_text_from_file(file_path: str) -> str:
    """Extract text from PDF or Word file based on extension."""
    file_path_obj = Path(file_path)
    extension = file_path_obj.suffix.lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)
    if extension in [".docx", ".doc"]:
        return extract_text_from_word(file_path)

    print(f"Unsupported file format: {extension}")
    return ""
