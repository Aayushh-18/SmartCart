"""
embedder.py — Semantic embedding helper using sentence-transformers.
Loads the all-MiniLM-L6-v2 model lazily on first use and caches
product embeddings in-memory so repeated /recommend calls are fast.

sentence-transformers is treated as an optional dependency:
if it cannot be imported (e.g. Render free-tier memory limits),
EMBEDDINGS_AVAILABLE is set to False and the recommender falls
back to pure collaborative filtering automatically.
"""

import numpy as np

try:
    from sentence_transformers import SentenceTransformer as _ST
    EMBEDDINGS_AVAILABLE = True
except Exception:  # ImportError or any build failure
    _ST = None
    EMBEDDINGS_AVAILABLE = False
    print("[embedder] sentence-transformers not available — using collaborative filtering only.")

# Lazy-loaded model and in-memory cache
_model = None
_cache: dict = {}


def _get_model():
    global _model
    if _model is None and EMBEDDINGS_AVAILABLE:
        _model = _ST("all-MiniLM-L6-v2")
    return _model


def embed(text: str):
    """Return a normalised embedding vector for *text*, or None if unavailable."""
    if not EMBEDDINGS_AVAILABLE:
        return None
    if text not in _cache:
        model = _get_model()
        if model is None:
            return None
        vec = model.encode(text, normalize_embeddings=True)
        _cache[text] = vec
    return _cache[text]


def cosine_similarity(a, b) -> float:
    """Cosine similarity between two normalised unit vectors."""
    if a is None or b is None:
        return 0.0
    return float(np.dot(a, b))


def embed_batch(texts: list) -> list:
    """Embed a list of texts, utilising the cache for each."""
    return [embed(t) for t in texts]
