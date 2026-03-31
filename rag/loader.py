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


# ── New: load a single PDF from a URL ──────────────────────────────────
def load_document_from_url(file_url: str, doc_id: str) -> list[Document]:
    """
    Downloads a PDF from UploadThing CDN into a temp file,
    loads it with PyPDFLoader, tags every page with doc_id.
    """

    response = requests.get(file_url, timeout=30, stream = True)
    response.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(response.content)
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()

        for doc in docs:
            doc.metadata["doc_id"] = doc_id
            doc.metadata["source_url"] = file_url

        return docs
    finally:
        os.unlink(tmp_path)