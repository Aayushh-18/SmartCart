"""
recommender.py — Hybrid recommendation engine.

Combines:
  1. Collaborative filtering (existing logic)  — weight 0.4
  2. Semantic embedding similarity             — weight 0.6

Both signals are normalised to [0, 1] before blending so no single
method dominates.
"""

from pymongo import MongoClient
from bson import ObjectId
from collections import defaultdict
from embedder import embed, cosine_similarity, EMBEDDINGS_AVAILABLE
import os

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://SmartCart:aayush182005@cluster0.n7rlxnr.mongodb.net/smartcart?retryWrites=true&w=majority&appName=Cluster0",
)

client = MongoClient(MONGO_URI)
db = client["smartcart"]

COLLAB_WEIGHT = 0.4
EMBED_WEIGHT = 0.6


# ─────────────────────────────────────────────
# Helper: build a text descriptor for a product
# ─────────────────────────────────────────────
def _product_text(product: dict) -> str:
    name = product.get("name", "")
    category = product.get("category", "")
    unit = product.get("unit", "")
    return f"{name} {category} {unit}".strip()


# ─────────────────────────────────────────────
# 1. Collaborative filtering score (normalised)
# ─────────────────────────────────────────────
def _collab_scores(user_products: set, all_orders: list) -> dict:
    """Return {productId: raw_count} for products not in user_products."""
    freq = defaultdict(int)
    for order in all_orders:
        order_pids = [str(item["productId"]) for item in order["items"]]
        if any(p in user_products for p in order_pids):
            for pid in order_pids:
                if pid not in user_products:
                    freq[pid] += 1

    if not freq:
        return {}

    max_freq = max(freq.values()) or 1
    return {pid: count / max_freq for pid, count in freq.items()}


# ─────────────────────────────────────────────
# 2. Embedding similarity score (normalised)
# ─────────────────────────────────────────────
def _embed_scores(user_products: set, all_products: list) -> dict:
    """
    For each product the user has NOT bought, compute the average
    cosine similarity to the products they HAVE bought.
    Returns {productId: avg_similarity}, or {} if embeddings unavailable.
    """
    if not EMBEDDINGS_AVAILABLE:
        return {}

    bought_products = [
        p for p in all_products if str(p["_id"]) in user_products
    ]
    if not bought_products:
        return {}

    bought_embeddings = [embed(_product_text(p)) for p in bought_products]

    scores = {}
    for product in all_products:
        pid = str(product["_id"])
        if pid in user_products:
            continue
        candidate_emb = embed(_product_text(product))
        sims = [cosine_similarity(candidate_emb, b) for b in bought_embeddings]
        scores[pid] = sum(sims) / len(sims) if sims else 0.0

    # Normalise to [0, 1]
    if scores:
        min_s, max_s = min(scores.values()), max(scores.values())
        rng = max_s - min_s or 1e-9
        scores = {pid: (s - min_s) / rng for pid, s in scores.items()}

    return scores


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────
def get_recommendations(user_id: str) -> list:
    """
    Return top-5 product recommendations for *user_id* using the
    hybrid collaborative-filtering + embedding approach.
    """
    try:
        query_id = ObjectId(user_id)
    except Exception:
        query_id = user_id

    # ── Gather user purchase history ──────────────────────────────
    user_orders = list(db.orders.find({"userId": query_id}))
    user_products: set[str] = set()
    for order in user_orders:
        for item in order["items"]:
            user_products.add(str(item["productId"]))

    if not user_products:
        return []

    # ── Load all products ─────────────────────────────────────────
    all_products = list(db.products.find({}))
    all_orders = list(db.orders.find({"userId": {"$ne": query_id}}))

    # ── Compute individual scores ─────────────────────────────────
    collab = _collab_scores(user_products, all_orders)
    embed_sim = _embed_scores(user_products, all_products)

    # ── Candidate product IDs ─────────────────────────────────────
    candidate_ids = set(collab.keys()) | set(embed_sim.keys())

    # ── Blend ────────────────────────────────────────────────────
    blended = {}
    for pid in candidate_ids:
        c = collab.get(pid, 0.0)
        e = embed_sim.get(pid, 0.0)
        blended[pid] = COLLAB_WEIGHT * c + EMBED_WEIGHT * e

    # ── Sort & fetch top-5 product docs ──────────────────────────
    top_pids = sorted(blended, key=lambda x: blended[x], reverse=True)[:5]

    recommendations = []
    for pid in top_pids:
        try:
            product = db.products.find_one({"_id": ObjectId(pid)})
        except Exception:
            continue
        if product:
            recommendations.append(
                {
                    "productId": pid,
                    "productName": product["name"],
                    "category": product["category"],
                    "price": product["price"],
                    "unit": product["unit"],
                    "score": round(blended[pid], 4),
                    "method": "hybrid-embedding",
                }
            )

    return recommendations