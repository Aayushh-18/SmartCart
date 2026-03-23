from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from predictor import predict_refill
from recommender import get_recommendations

app = FastAPI(
    title="SmartCart AI",
    description="AI-powered grocery prediction and recommendation engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def home():
    return {"message": "SmartCart AI Module Running ✅"}

@app.get("/predict/{user_id}")
def predict(user_id: str):
    try:
        predictions = predict_refill(user_id)
        return {
            "userId": user_id,
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/{user_id}")
def recommend(user_id: str):
    try:
        recommendations = get_recommendations(user_id)
        return {
            "userId": user_id,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))