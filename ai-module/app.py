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

# ── Optional: google-generativeai ────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GENAI_IMPORT_ERROR = None
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except Exception as e:
    genai = None
    GENAI_AVAILABLE = False
    GENAI_IMPORT_ERROR = str(e)
    print(f"[app] google-generativeai import failed: {e}")

# ── Gemini model setup ────────────────────────────────────────────
_gemini_model = None
if GENAI_AVAILABLE:
    if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            print("[app] Gemini model loaded ✅")
        except Exception as e:
            print(f"[app] Gemini setup failed: {e}")
    else:
        print("[app] GEMINI_API_KEY not set — /chat disabled")

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
    if _gemini_model is None:
        key_status = "empty or not found"
        if GEMINI_API_KEY:
            key_status = f"found (starts with {GEMINI_API_KEY[:4]}), but model failed to load"
        
        if GENAI_IMPORT_ERROR:
            key_status = f"module failed to import: {GENAI_IMPORT_ERROR}"
        
        raise HTTPException(
            status_code=503,
            detail=f"Gemini API key issue: {key_status}. Please check Render environment variables.",
        )

    try:
        system_prompt = _build_system_prompt(req.userId)

        # Reconstruct conversation history for multi-turn chat
        history = []
        for turn in req.history:
            history.append({"role": turn["role"], "parts": [turn["parts"]]})

        chat_session = _gemini_model.start_chat(history=history)

        # Prepend system context to the first user message only when history is empty
        user_message = req.message
        if not req.history:
            user_message = system_prompt + "\n\nUser: " + req.message

        response = chat_session.send_message(user_message)
        reply = response.text.strip()

        return ChatResponse(reply=reply)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")