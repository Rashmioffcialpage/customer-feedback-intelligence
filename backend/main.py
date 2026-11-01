from contextlib import asynccontextmanager
from pathlib import Path

import joblib
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "sentiment_pipeline.joblib"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_PATH.exists():
        raise RuntimeError(
            "Model file not found. Run the notebook cell that saves "
            "models/sentiment_pipeline.joblib before starting the API."
        )

    # Load the locally trained pipeline once at startup.
    app.state.sentiment_model = joblib.load(MODEL_PATH)

    yield

    del app.state.sentiment_model


app = FastAPI(
    title="Customer Feedback Intelligence API",
    description=(
        "Classifies review text as positive or negative using "
        "a locally trained TF-IDF and logistic regression pipeline."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class PredictionRequest(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=5000,
        description="Review text to classify.",
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Please enter review text.")

        return cleaned


class PredictionResponse(BaseModel):
    text: str
    label: int
    sentiment: str
    limitation: str


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Customer Feedback Intelligence API",
    }


@app.post("/api/predict", response_model=PredictionResponse)
def predict_sentiment(
    payload: PredictionRequest,
    request: Request,
):
    model = request.app.state.sentiment_model

    label = int(model.predict([payload.text])[0])

    return PredictionResponse(
        text=payload.text,
        label=label,
        sentiment="Positive" if label == 1 else "Negative",
        limitation=(
            "This model predicts one positive or negative label. "
            "It does not identify neutral sentiment or separate "
            "mixed opinions within a review."
        ),
    )
class BatchPredictionRequest(BaseModel):
    reviews: list[PredictionRequest] = Field(
        min_length=1,
        max_length=100,
        description="Between 1 and 100 reviews to classify.",
    )


class BatchSummary(BaseModel):
    total: int
    positive: int
    negative: int


class BatchPredictionResponse(BaseModel):
    results: list[PredictionResponse]
    summary: BatchSummary


@app.post(
    "/api/predict/batch",
    response_model=BatchPredictionResponse,
)
def predict_batch(
    payload: BatchPredictionRequest,
    request: Request,
):
    model = request.app.state.sentiment_model

    texts = [review.text for review in payload.reviews]
    predictions = model.predict(texts)

    limitation = (
        "This model predicts one positive or negative label. "
        "It does not identify neutral sentiment or separate "
        "mixed opinions within a review."
    )

    results = [
        PredictionResponse(
            text=text,
            label=int(prediction),
            sentiment=(
                "Positive" if int(prediction) == 1 else "Negative"
            ),
            limitation=limitation,
        )
        for text, prediction in zip(texts, predictions)
    ]

    positive_count = sum(result.label == 1 for result in results)

    return BatchPredictionResponse(
        results=results,
        summary=BatchSummary(
            total=len(results),
            positive=positive_count,
            negative=len(results) - positive_count,
        ),
    )