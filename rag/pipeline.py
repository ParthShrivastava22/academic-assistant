import os
import shutil
from loader import load_document_from_url
from chunker import split_documents
from embedder import load_embedding_model
from vector_store import create_vector_store
from langchain_community.vectorstores import FAISS

FAISS_STORE_PATH = os.path.join(os.path.dirname(__file__), "faiss_indexes")
os.makedirs(FAISS_STORE_PATH, exist_ok=True)


def _project_index_path(project_id: str) -> str:
    """Each project gets one shared FAISS index containing all its papers."""
    return os.path.join(FAISS_STORE_PATH, f"project_{project_id}")


def _load_project_index(project_id: str, embeddings):
    """
    Load an existing project index from disk.
    Raises FileNotFoundError if no papers have been ingested yet.
    """
    path = _project_index_path(project_id)

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"No index found for project '{project_id}'. "
            "Ingest at least one paper first."
        )

    return FAISS.load_local(
        folder_path=path,
        embeddings=embeddings,
        allow_dangerous_deserialization=True,
    )


def ingest_document(
    file_url: str,
    doc_id: str,          # this is paper_id
    project_id: str,
    paper_title: str,
    authors: list[str],
) -> int:
    """
    Ingest one paper into the project's shared FAISS index.
    If the index already exists (other papers ingested),
    we merge the new vectors in rather than overwriting.
    """

    # 1. Load PDF with full metadata tagging
    documents = load_document_from_url(
        file_url=file_url,
        paper_id=doc_id,
        project_id=project_id,
        paper_title=paper_title,
        authors=authors,
    )

    # 2. Chunk — uses chunker.py untouched
    chunks = split_documents(documents)

    # 3. Embed — uses embedder.py untouched
    embeddings = load_embedding_model()

    project_index_path = _project_index_path(project_id)

    if os.path.exists(project_index_path):
        # Project index already exists — merge new paper's vectors in
        existing_db = FAISS.load_local(
            folder_path=project_index_path,
            embeddings=embeddings,
            allow_dangerous_deserialization=True,
        )
        new_db = create_vector_store(chunks, embeddings)
        existing_db.merge_from(new_db)
        existing_db.save_local(folder_path=project_index_path)
    else:
        # First paper in this project — create the index fresh
        db = create_vector_store(chunks, embeddings)
        db.save_local(folder_path=project_index_path)

    return len(chunks)


def query_project(
    question: str,
    project_id: str,
    top_k: int = 6,       # higher than before — pulling from multiple papers
) -> list[dict]:
    """
    Query the project's shared FAISS index.
    Returns chunks with full paper metadata for citation.
    top_k=6 gives ~1-2 chunks per paper for a 5-paper project.
    """

    embeddings = load_embedding_model()
    vector_db = _load_project_index(project_id, embeddings)

    retriever = vector_db.as_retriever(search_kwargs={"k": top_k})
    docs = retriever.invoke(question)

    return [
        {
            "content":     doc.page_content,
            "paper_id":    doc.metadata.get("paper_id"),
            "paper_title": doc.metadata.get("paper_title", "Unknown Paper"),
            "authors":     doc.metadata.get("authors", "Unknown Authors"),
            "page":        doc.metadata.get("page", None),
            "project_id":  doc.metadata.get("project_id", project_id),
        }
        for doc in docs
    ]


def delete_project_index(project_id: str) -> bool:
    """Delete the entire project FAISS index from disk."""
    path = _project_index_path(project_id)
    if not os.path.exists(path):
        return False
    shutil.rmtree(path)
    return True


def delete_paper_from_index(paper_id: str, project_id: str) -> bool:
    """
    FAISS does not support deleting individual vectors natively.
    We filter out the paper's chunks and rebuild the index without them.
    Returns False if the project index doesn't exist.
    """
    embeddings = load_embedding_model()
    project_index_path = _project_index_path(project_id)

    if not os.path.exists(project_index_path):
        return False

    db = FAISS.load_local(
        folder_path=project_index_path,
        embeddings=embeddings,
        allow_dangerous_deserialization=True,
    )

    # FAISS stores docs in a dict keyed by integer index
    # Filter out all chunks that belong to the deleted paper
    remaining_docs = [
        doc for doc in db.docstore._dict.values()
        if doc.metadata.get("paper_id") != paper_id
    ]

    if not remaining_docs:
        # No papers left — delete the whole index
        shutil.rmtree(project_index_path)
        return True

    # Rebuild the index from remaining documents
    new_db = create_vector_store(remaining_docs, embeddings)
    new_db.save_local(folder_path=project_index_path)
    return True