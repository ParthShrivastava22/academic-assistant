from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pipeline import (
    ingest_document,
    query_project,
    delete_project_index,
    delete_paper_from_index,
)
import os
import httpx

load_dotenv()

app = FastAPI(title="Lexis RAG API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.environ.get("WEB_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ────────────────────────────────────────────────────────────────

def verify_internal_token(x_internal_token: str = Header(...)):
    if x_internal_token != os.environ["INTERNAL_API_SECRET"]:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── Models ──────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    doc_id: str          # paper_id (MongoDB Paper _id)
    project_id: str      # which project this paper belongs to
    file_url: str
    paper_title: str
    authors: list[str] = []

class IngestResponse(BaseModel):
    success: bool
    doc_id: str
    message: str

class QueryRequest(BaseModel):
    project_id: str      # query across whole project
    question: str
    top_k: int = 6

class SourceChunk(BaseModel):
    content: str
    paper_id: str | None
    paper_title: str
    authors: str
    page: int | None

class QueryResponse(BaseModel):
    project_id: str
    question: str
    sources: list[SourceChunk]


# ── Background ingestion ─────────────────────────────────────────────────

def run_ingestion(
    paper_id: str,
    project_id: str,
    file_url: str,
    paper_title: str,
    authors: list[str],
    callback_url: str,
    secret: str,
):
    """Runs in background after /ingest returns 202."""
    try:
        chunks_stored = ingest_document(
            file_url=file_url,
            doc_id=paper_id,
            project_id=project_id,
            paper_title=paper_title,
            authors=authors,
        )
        status = "ready"
        print(f"[INGEST] ✓ paper {paper_id} in project {project_id} "
              f"— {chunks_stored} chunks")
    except Exception as e:
        chunks_stored = 0
        status = "error"
        print(f"[INGEST] ✗ paper {paper_id}: {e}")

    # Callback to Next.js to update MongoDB
    try:
        with httpx.Client() as client:
            client.post(
                callback_url,
                json={
                    "doc_id": paper_id,
                    "status": status,
                    "chunk_count": chunks_stored,
                },
                headers={"x-internal-token": secret},
                timeout=10,
            )
    except Exception as e:
        print(f"[INGEST] Callback failed for paper {paper_id}: {e}")


# ── Routes ───────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}


@app.post("/ingest", response_model=IngestResponse, status_code=202)
def ingest(
    req: IngestRequest,
    background_tasks: BackgroundTasks,
    x_internal_token: str = Header(...),
):
    verify_internal_token(x_internal_token)

    web_url = os.environ.get("WEB_URL", "http://localhost:3000")

    background_tasks.add_task(
        run_ingestion,
        paper_id=req.doc_id,
        project_id=req.project_id,
        file_url=req.file_url,
        paper_title=req.paper_title,
        authors=req.authors,
        callback_url=f"{web_url}/api/ingest-callback",
        secret=os.environ["INTERNAL_API_SECRET"],
    )

    return IngestResponse(
        success=True,
        doc_id=req.doc_id,
        message=f"Ingestion started for '{req.paper_title}'",
    )


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest, x_internal_token: str = Header(...)):
    verify_internal_token(x_internal_token)

    try:
        sources = query_project(
            question=req.question,
            project_id=req.project_id,
            top_k=req.top_k,
        )
        return QueryResponse(
            project_id=req.project_id,
            question=req.question,
            sources=[SourceChunk(**s) for s in sources],
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/project/{project_id}")
def delete_project(project_id: str, x_internal_token: str = Header(...)):
    """Called when a user deletes an entire project."""
    verify_internal_token(x_internal_token)

    try:
        existed = delete_project_index(project_id)
        return {"success": True, "project_id": project_id, "existed": existed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/project/{project_id}/paper/{paper_id}")
def delete_paper(
    project_id: str,
    paper_id: str,
    x_internal_token: str = Header(...),
):
    """
    Called when a user deletes a single paper.
    Rebuilds the project FAISS index without that paper's chunks.
    """
    verify_internal_token(x_internal_token)

    try:
        existed = delete_paper_from_index(
            paper_id=paper_id,
            project_id=project_id,
        )
        return {
            "success": True,
            "paper_id": paper_id,
            "project_id": project_id,
            "existed": existed,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))