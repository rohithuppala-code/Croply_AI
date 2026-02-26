import cv2
import torch
import numpy as np
from PIL import Image
import torch.nn as nn
from torchvision import models, transforms
import os

def predict_leaf_disease(image_path, model_path="leaf_disease_model_final.pth", data_dir="Datasets/PlantVillage/train"):
    """
    Function that takes an image path and returns the predicted plant leaf disease category.
    """
    # Get class names in the same order as during training
    CLASS_NAMES = sorted(os.listdir(data_dir))
    
    # Load the model with the same architecture as training
    model = models.resnet50(weights=None)
    
    # Use the EXACT same model architecture as in training
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(2048, 1024),
        nn.BatchNorm1d(1024),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.Linear(1024, len(CLASS_NAMES))
    )
    
    # Load the trained model weights
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval()
    
    # Preprocess image using same pipeline as training
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Error: Unable to load image from {image_path}")
        
    # Apply preprocessing pipeline similar to the dataset class
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = np.ones((3, 3), np.uint8)
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    result = cv2.bitwise_and(image, image, mask=morph)
    hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV)
    img = Image.fromarray(cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB))
    
    # Apply transforms like in validation
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    img_tensor = transform(img).unsqueeze(0)
    
    # Make prediction
    with torch.no_grad():
        outputs = model(img_tensor)
        _, predicted = torch.max(outputs, 1)
        prediction_idx = predicted.item()
    
    # Calculate confidence score
    probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
    confidence = probabilities[prediction_idx].item() * 100
    
    return {
        'category': CLASS_NAMES[prediction_idx],
        'confidence': confidence
    }

if __name__ == "__main__":
    try:
        # You can provide a command-line argument for the image path if needed
        import sys
        image_path = sys.argv[1] if len(sys.argv) > 1 else "test5.jpeg"
        
        result = predict_leaf_disease(image_path)
        print(f"This leaf is: {result['category']}")
        print(f"Confidence: {result['confidence']:.2f}%")
        
    except Exception as e:
        print(f"Error: {e}")