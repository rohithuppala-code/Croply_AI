from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import tempfile
import os
import imghdr
from dotenv import load_dotenv

# Internal imports
from predict import predict_leaf_disease
from llm import get_disease_info, chat_response, get_care_tips

# Load environment variables
load_dotenv()

# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Croply AI — Plant Health Platform",
    description="AI-Powered Plant Disease Detection, Chat Assistant, and Care Tips API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Models ─────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    language: str = "English"
    history: Optional[List[ChatMessage]] = None

class CareTipsRequest(BaseModel):
    plant_name: str
    language: str = "English"


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Health check / welcome endpoint"""
    return {
        "app": "Croply AI",
        "version": "1.0.0",
        "endpoints": ["/predict", "/chat", "/care-tips"],
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...), language: str = Form("English")):
    """
    Upload a leaf image → get disease prediction + LLM-powered disease information.
    """
    # Read and validate image
    content = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        img_type = imghdr.what(tmp_path)
        if img_type is None:
            raise HTTPException(status_code=400, detail="Invalid image file. Upload JPG or PNG.")

        # Model prediction
        prediction = predict_leaf_disease(tmp_path)

        # Low confidence → likely not a valid / clear leaf image
        CONFIDENCE_THRESHOLD = 40.0
        if prediction["confidence"] < CONFIDENCE_THRESHOLD:
            return JSONResponse(content={
                "filename": file.filename,
                "image_type": img_type,
                "is_valid_leaf": False,
                "message": "The uploaded image does not appear to be a clear leaf photo. Please upload a clear image of a plant leaf.",
                "prediction": {
                    "class": prediction["category"],
                    "confidence": prediction["confidence"],
                },
                "disease_information": None,
            })

        # LLM disease info
        try:
            disease_info = get_disease_info(prediction["category"], language)
        except Exception:
            disease_info = {"raw_content": "Could not fetch disease info. Check GROQ_API_KEY."}

        return JSONResponse(content={
            "filename": file.filename,
            "image_type": img_type,
            "is_valid_leaf": True,
            "prediction": {
                "class": prediction["category"],
                "confidence": prediction["confidence"],
            },
            "disease_information": disease_info,
        })
    finally:
        os.unlink(tmp_path)


@app.post("/chat")
async def chat(req: ChatRequest):
    """AI chat — ask any plant disease / care question."""
    try:
        history_dicts = [msg.model_dump() for msg in req.history] if req.history else None
        response = chat_response(req.message, req.language, history=history_dicts)
        return JSONResponse(content={"response": response})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@app.post("/care-tips")
async def care_tips_endpoint(req: CareTipsRequest):
    """Get AI-generated plant care routine."""
    try:
        tips = get_care_tips(req.plant_name, req.language)
        return JSONResponse(content={"tips": tips})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Care tips error: {str(e)}")


# ── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)