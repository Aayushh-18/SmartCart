"""
app.py — SmartCart AI FastAPI service.

Endpoints:
  GET  /                      — health check
  GET  /predict/{user_id}     — refill date predictions
  GET  /recommend/{user_id}   — hybrid embedding recommendations
  POST /chat                  — LLM-powered product assistant (Gemini)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from predictor import predict_refill
from recommender import get_recommendations
import os

# ── Optional: python-dotenv ───────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ── Optional: Groq (free LLM API — no billing required) ─────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
_groq_client = None
try:
    from groq import Groq
    if GROQ_API_KEY:
        _groq_client = Groq(api_key=GROQ_API_KEY)
        print("[app] Groq client loaded ✅")
    else:
        print("[app] GROQ_API_KEY not set — /chat disabled")
except Exception as e:
    print(f"[app] Groq import failed: {e}")

# ── MongoDB (for chat context) ────────────────────────────────────
try:
    from pymongo import MongoClient
    MONGO_URI = os.getenv(
        "MONGO_URI",
        "mongodb+srv://SmartCart:aayush182005@cluster0.n7rlxnr.mongodb.net/smartcart?retryWrites=true&w=majority&appName=Cluster0",
    )
    _mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    _db = _mongo_client["smartcart"]
    print("[app] MongoDB connected ✅")
except Exception as e:
    _db = None
    print(f"[app] MongoDB connection failed: {e}")

# ── FastAPI app ───────────────────────────────────────────────────
app = FastAPI(
    title="SmartCart AI",
    description="Integrated LLM-powered recommendation and conversational assistant",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ────────────────────────────────────
class ChatRequest(BaseModel):
    userId: str
    message: str
    history: List[Dict[str, Any]] = []


class ChatResponse(BaseModel):
    reply: str


# ── Helpers ───────────────────────────────────────────────────────
def _build_system_prompt(user_id: str) -> str:
    """Build a context-rich system prompt with live product catalog."""
    catalog_text = "No products available right now."
    if _db is not None:
        try:
            products = list(_db.products.find({}, {"name": 1, "category": 1, "price": 1, "unit": 1, "stock": 1}))
            catalog_lines = []
            for p in products:
                stock_status = "in stock" if p.get("stock", 0) > 0 else "out of stock"
                catalog_lines.append(
                    f"- {p['name']} ({p['category']}) — Rs.{p['price']}/{p['unit']}, {stock_status}"
                )
            if catalog_lines:
                catalog_text = "\n".join(catalog_lines)
        except Exception:
            pass

    return f"""You are SmartCart AI, a friendly and knowledgeable grocery shopping assistant.
Your job is to help customers find the right products, suggest substitutes, explain pricing, 
and provide grocery tips. Always be helpful, concise, and conversational.

Current product catalog:
{catalog_text}

Guidelines:
- Only recommend products that exist in the catalog above.
- If asked about stock, use the stock info provided.
- Keep responses under 120 words unless the user asks for detailed info.
- Always respond in the same language the user writes in.
- Never make up product names or prices.
"""


# ── Routes ────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {
        "message": "SmartCart AI Module Running ✅",
        "version": "2.0.0",
        "features": ["refill-prediction", "hybrid-embedding-recommendations", "llm-chatbot"],
    }


@app.get("/predict/{user_id}")
def predict(user_id: str):
    try:
        predictions = predict_refill(user_id)
        return {"userId": user_id, "predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommend/{user_id}")
def recommend(user_id: str):
    try:
        recommendations = get_recommendations(user_id)
        return {"userId": user_id, "recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if _groq_client is None:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not configured. Set it in Render environment variables.",
        )

    try:
        system_prompt = _build_system_prompt(req.userId)

        # Reconstruct conversation history for multi-turn chat
        messages = [{"role": "system", "content": system_prompt}]
        for turn in req.history:
            role = turn.get("role", "user")
            # Groq uses 'assistant' not 'model'
            if role == "model":
                role = "assistant"
            content = turn.get("parts", turn.get("content", ""))
            if isinstance(content, list):
                content = content[0] if content else ""
            messages.append({"role": role, "content": str(content)})

        messages.append({"role": "user", "content": req.message})

        response = _groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=256,
            temperature=0.7,
        )
        reply = response.choices[0].message.content.strip()

        return ChatResponse(reply=reply)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")