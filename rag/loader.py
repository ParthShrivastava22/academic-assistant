from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
import os
import requests
import tempfile


# ── Original function — untouched ──────────────────────────────────────
def load_documents(folder_path):

    documents = []

    for file in os.listdir(folder_path):

        if file.endswith(".pdf"):

            path = os.path.join(folder_path, file)

            loader = PyPDFLoader(path)

            docs = loader.load()

            documents.extend(docs)

    return documents


# ── Updated: load from URL with full metadata tagging ──────────────────
def load_document_from_url(
    file_url: str,
    paper_id: str,
    project_id: str,
    paper_title: str,
    authors: list[str],
) -> list[Document]:
    """
    Downloads a PDF from UploadThing CDN and loads it with PyPDFLoader.
    Tags every page chunk with paper metadata so the LLM can cite sources.
    """

    response = requests.get(file_url, timeout=30, stream = True)
    response.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(response.content)
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()

        # Tag every chunk — this is what enables per-paper citations later
        for doc in docs:
            doc.metadata.update({
                "paper_id":    paper_id,
                "project_id":  project_id,
                "paper_title": paper_title,
                "authors":     ", ".join(authors) if authors else "Unknown",
            })
        return docs
    finally:
        os.unlink(tmp_path)