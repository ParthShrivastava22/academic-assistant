from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pipeline import ingest_document, query_document, delete_document_index
import os
import httpx  # for the status callback to Next.js

load_dotenv()

app = FastAPI(title="Lexis RAG API", version="1.0.0")

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


def verify_internal_token(x_internal_token: str = Header(...)):
    if x_internal_token != os.environ["INTERNAL_API_SECRET"]:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── Models ──────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    doc_id: str
    file_url: str

class IngestResponse(BaseModel):
    success: bool
    doc_id: str
    message: str

class QueryRequest(BaseModel):
    doc_id: str
    question: str

class SourceChunk(BaseModel):
    content: str
    page: int | None

class QueryResponse(BaseModel):
    doc_id: str
    question: str
    sources: list[SourceChunk]


# ── Background task ─────────────────────────────────────────────────────

def run_ingestion(doc_id: str, file_url: str, callback_url: str, secret: str):
    """
    Runs in the background after /ingest returns 202.
    Ingests the document, then POSTs the result back to Next.js
    so MongoDB status can be updated to "ready" or "error".
    """
    try:
        chunks_stored = ingest_document(file_url=file_url, doc_id=doc_id)
        status = "ready"
        print(f"[INGEST] ✓ doc {doc_id} — {chunks_stored} chunks stored")
    except Exception as e:
        status = "error"
        print(f"[INGEST] ✗ doc {doc_id} — {e}")

    # Call back to Next.js to update MongoDB status
    try:
        with httpx.Client() as client:
            client.post(
                callback_url,
                json={"doc_id": doc_id, "status": status},
                headers={"x-internal-token": secret},
                timeout=10,
            )
    except Exception as e:
        print(f"[INGEST] Callback failed for doc {doc_id}: {e}")


# ── Routes ──────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/ingest", response_model=IngestResponse, status_code=202)
def ingest(
    req: IngestRequest,
    background_tasks: BackgroundTasks,
    x_internal_token: str = Header(...),
):
    """
    Accepts the ingest job and returns 202 Accepted immediately.
    The actual ingestion runs in the background via BackgroundTasks.
    """
    verify_internal_token(x_internal_token)

    web_url = os.environ.get("WEB_URL", "http://localhost:3000")
    callback_url = f"{web_url}/api/documents/status-update"
    secret = os.environ["INTERNAL_API_SECRET"]

    background_tasks.add_task(
        run_ingestion,
        doc_id=req.doc_id,
        file_url=req.file_url,
        callback_url=callback_url,
        secret=secret,
    )

    return IngestResponse(
        success=True,
        doc_id=req.doc_id,
        message="Ingestion started in background",
    )


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest, x_internal_token: str = Header(...)):
    verify_internal_token(x_internal_token)

    try:
        sources = query_document(question=req.question, doc_id=req.doc_id)
        return QueryResponse(
            doc_id=req.doc_id,
            question=req.question,
            sources=[SourceChunk(**s) for s in sources],
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/document/{doc_id}")
def delete_document(doc_id: str, x_internal_token: str = Header(...)):
    verify_internal_token(x_internal_token)

    try:
        existed = delete_document_index(doc_id)
        return {"success": True, "doc_id": doc_id, "index_existed": existed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))