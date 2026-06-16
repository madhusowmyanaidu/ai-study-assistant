import os
from pypdf import PdfReader
from typing import List, Dict, Any

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text from PDF page by page.
    Returns a list of dicts: [{"page": page_num, "text": text_content}]
    """
    pages_data = []
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at {file_path}")
        
    try:
        reader = PdfReader(file_path)
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                text = text.strip()
                if len(text) > 0:
                    pages_data.append({
                        "page": idx + 1,
                        "text": text
                    })
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
        raise e
        
    return pages_data

def chunk_text(pages_data: List[Dict[str, Any]], chunk_size: int = 1000, chunk_overlap: int = 200) -> List[Dict[str, Any]]:
    """
    Splits page texts into chunks of roughly `chunk_size` characters with `chunk_overlap` overlap.
    Preserves page number references.
    """
    chunks = []
    
    for page_info in pages_data:
        text = page_info["text"]
        page_num = page_info["page"]
        
        # If the page text is shorter than chunk_size, keep it whole
        if len(text) <= chunk_size:
            chunks.append({
                "text": text,
                "page": page_num
            })
            continue
            
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append({
                "text": chunk,
                "page": page_num
            })
            # Move the window, ensuring we don't get stuck if overlap >= chunk_size
            step = max(chunk_size - chunk_overlap, 100)
            start += step
            
    return chunks
