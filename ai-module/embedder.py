"""
embedder.py — Semantic embedding helper using sentence-transformers.
Loads the all-MiniLM-L6-v2 model once at import time and caches
product embeddings in-memory so repeated /recommend calls are fast.
"""

from sentence_transformers import SentenceTransformer
import numpy as np

# Load once at module level (cached across requests)
_model = SentenceTransformer("all-MiniLM-L6-v2")

# In-memory cache:  text  →  ndarray
_cache: dict[str, np.ndarray] = {}


def embed(text: str) -> np.ndarray:
    """Return a normalised embedding vector for *text*."""
    if text not in _cache:
        vec = _model.encode(text, normalize_embeddings=True)
        _cache[text] = vec
    return _cache[text]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two normalised unit vectors."""
    return float(np.dot(a, b))


def embed_batch(texts: list[str]) -> list[np.ndarray]:
    """Embed a list of texts, utilising the cache for each."""
    return [embed(t) for t in texts]
