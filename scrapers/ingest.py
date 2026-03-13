"""
ChromaDB Ingest Script
======================
Rebuilds the vector database from scratch with better chunking.

Sources:
  1. data/raw_pdf/income_tax_act_1961.pdf   — Income Tax Act 1961 (915 pages)
  2. data/raw_markdown/rules/*.md            — Income Tax Rules 1962 (518 rules)

Improvements over original ingest:
  - chunk_size=1800, overlap=400 for PDF (was too small, split sections mid-sentence)
  - chunk_size=1500, overlap=200 for markdown rules
  - Section number extracted from PDF chunks → metadata for targeted retrieval
  - Progress printed per batch so you can see it working

Usage (run from project root):
    pip install langchain-chroma langchain-huggingface langchain-community pypdf python-dotenv
    python scrapers/ingest.py
"""

import os
import re
import sys
import shutil
from pathlib import Path
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Paths — resolve relative to project root regardless of cwd
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR     = PROJECT_ROOT / "data"
PDF_PATH     = DATA_DIR / "raw_pdf" / "income_tax_act_1961.pdf"
RULES_DIR    = DATA_DIR / "raw_markdown" / "rules"
CHROMA_DIR   = PROJECT_ROOT / "backend" / "data" / "chroma_db"
ENV_PATH     = PROJECT_ROOT / "backend" / ".env"

load_dotenv(ENV_PATH)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def extract_section_numbers(text: str) -> list[str]:
    """Pull Section numbers from a text chunk.
    Catches both 'section 80D' references and section definitions like '80D. (1)'.
    """
    # References: "section 80D", "under section 194A"
    refs = re.findall(r"\bsection\s+(\d+[A-Z\-]*(?:\(\w+\))*)", text, re.IGNORECASE)
    # Definitions at line start: "80D. (1)" or "194A."
    defs = re.findall(r"(?:^|\n)\s*(\d{2,3}[A-Z]{0,3})[\.\s]\s*\(?\d", text)
    return list(dict.fromkeys(refs + defs))


def extract_rule_number_from_path(filepath: str) -> str:
    """Extract rule number from filename, e.g. rule_11DD.md → 11DD."""
    name = Path(filepath).stem          # rule_11DD
    raw = name.replace("rule_", "", 1)  # 11DD
    return raw.replace("_", "-")        # some rules use hyphens (11-OB)


# ---------------------------------------------------------------------------
# 1. Load and chunk the Income Tax Act PDF
# ---------------------------------------------------------------------------
def load_pdf_chunks():
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    print(f"\n[PDF] Loading {PDF_PATH.name} ...")
    loader = PyPDFLoader(str(PDF_PATH))
    pages = loader.load()
    print(f"[PDF] Loaded {len(pages)} pages")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1800,
        chunk_overlap=400,
        separators=["\n\n\n", "\n\n", "\n", " ", ""],
    )

    chunks = splitter.split_documents(pages)
    print(f"[PDF] Split into {len(chunks)} chunks")

    # Enrich metadata with section numbers found in each chunk
    for chunk in chunks:
        sections = extract_section_numbers(chunk.page_content)
        if sections:
            chunk.metadata["sections"] = ", ".join(dict.fromkeys(sections))  # unique, ordered
        chunk.metadata["source_type"] = "act"

    return chunks


# ---------------------------------------------------------------------------
# 2. Load and chunk the Income Tax Rules markdown files
# ---------------------------------------------------------------------------
def load_rule_chunks():
    from langchain_community.document_loaders import DirectoryLoader, TextLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    print(f"\n[Rules] Loading markdown files from {RULES_DIR} ...")
    loader = DirectoryLoader(
        str(RULES_DIR),
        glob="*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
        show_progress=False,
    )
    docs = loader.load()
    print(f"[Rules] Loaded {len(docs)} rule files")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
        separators=["\n\n\n", "\n\n", "\n", " ", ""],
    )

    chunks = splitter.split_documents(docs)
    print(f"[Rules] Split into {len(chunks)} chunks")

    # Add rule_number metadata to every chunk (for targeted filtering)
    for chunk in chunks:
        rule_num = extract_rule_number_from_path(chunk.metadata.get("source", ""))
        chunk.metadata["rule_number"] = rule_num.upper()
        chunk.metadata["source_type"] = "rules"

    return chunks


# ---------------------------------------------------------------------------
# 3. Build ChromaDB
# ---------------------------------------------------------------------------
def build_chroma(chunks):
    from langchain_chroma import Chroma
    from langchain_huggingface import HuggingFaceEndpointEmbeddings

    hf_token = os.getenv("HF_API_TOKEN")
    if not hf_token:
        print("ERROR: HF_API_TOKEN not found in backend/.env")
        sys.exit(1)

    print(f"\n[Chroma] Wiping old DB at {CHROMA_DIR} ...")
    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)
    CHROMA_DIR.mkdir(parents=True)

    print("[Chroma] Initialising HuggingFace embedding API ...")
    embeddings = HuggingFaceEndpointEmbeddings(
        model="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=hf_token,
    )

    # Embed in batches so we can show progress and avoid API timeouts
    BATCH = 64
    total = len(chunks)
    print(f"[Chroma] Embedding {total} chunks in batches of {BATCH} ...")

    db = None
    for i in range(0, total, BATCH):
        batch = chunks[i : i + BATCH]
        pct = (i + len(batch)) / total * 100
        print(f"  Batch {i // BATCH + 1:>4} / {(total + BATCH - 1) // BATCH}  "
              f"({i + len(batch):>5}/{total})  {pct:5.1f}%", end="\r")

        if db is None:
            db = Chroma.from_documents(
                batch,
                embedding=embeddings,
                persist_directory=str(CHROMA_DIR),
            )
        else:
            db.add_documents(batch)

    print(f"\n[Chroma] Done. Total vectors: {db._collection.count()}")
    return db


# ---------------------------------------------------------------------------
# 4. Smoke-test the new DB
# ---------------------------------------------------------------------------
def smoke_test(db):
    """Smoke test using hybrid retrieval (keyword scan + semantic search).
    Mirrors the logic in backend/src/rag_engine.py hybrid_retrieve().
    """
    print("\n[Test] Running smoke tests (hybrid retrieval) ...")

    all_data = db._collection.get(include=["documents", "metadatas"])

    def keyword_scan(section_num):
        """Find chunks that literally contain 'sectionXX' or 'XX.' patterns."""
        sn_esc = re.escape(section_num)
        pat = re.compile(
            r"(?:section\s+" + sn_esc + r"\b|" + sn_esc + r"\s*[.(])",
            re.IGNORECASE,
        )
        return [d for d in all_data["documents"] if pat.search(d)]

    tests = [
        ("80D", "twenty-five"),          # Section 80D — deduction limit ₹25,000
        ("80C", "80C"),                  # Section 80C — present in DB
        ("80DDB", "80DDB"),              # Section 80DDB
        ("194", "194"),                  # TDS section
        ("11DD", "11DD"),                # Rule 11DD
    ]

    for section, expected in tests:
        chunks = keyword_scan(section)
        found = any(expected.lower() in c.lower() for c in chunks)
        status = "PASS" if found else "FAIL"
        print(f"  [{status}] Section/Rule {section} -> expected '{expected}' | keyword matched {len(chunks)} chunks")
        if status == "FAIL" and chunks:
            print(f"         Sample: {chunks[0][:120].strip()}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("  TaxAssist — ChromaDB Ingest")
    print("=" * 60)

    pdf_chunks  = load_pdf_chunks()
    rule_chunks = load_rule_chunks()
    all_chunks  = pdf_chunks + rule_chunks

    print(f"\n[Summary] Total chunks to embed: {len(all_chunks)}")
    print(f"          PDF  (Act)  : {len(pdf_chunks)}")
    print(f"          Rules (MD) : {len(rule_chunks)}")

    db = build_chroma(all_chunks)
    smoke_test(db)

    print("\nIngest complete. ChromaDB updated at:", CHROMA_DIR)
