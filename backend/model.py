import cv2
import torch
import numpy as np
from PIL import Image
import torch.nn as nn
from torchvision import models, transforms
from torch.utils.data import Dataset, DataLoader, random_split
from torch.optim.lr_scheduler import ReduceLROnPlateau, CosineAnnealingLR
import os
import random

# Set seeds for reproducibility
def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

set_seed()

class LeafDataset(Dataset):
    """
    Custom dataset class that applies preprocessing and transformations
    during training and validation.
    """
    def __init__(self, image_dir, transform=None, is_train=True, augment_prob=0.5):
        self.image_dir = image_dir
        self.transform = transform
        self.is_train = is_train
        self.augment_prob = augment_prob
        self.image_paths = []
        self.labels = []
        
        # Get all classes from directory
        self.classes = sorted([d for d in os.listdir(image_dir) if os.path.isdir(os.path.join(image_dir, d))])
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        
        # Load all images and labels directly
        for class_name in self.classes:
            class_dir = os.path.join(image_dir, class_name)
            for img_name in os.listdir(class_dir):
                if img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    self.image_paths.append(os.path.join(class_dir, img_name))
                    self.labels.append(self.class_to_idx[class_name])
        
        print(f"Found {len(self.image_paths)} images in {image_dir} across {len(self.classes)} classes")

    def preprocess_image(self, image_path):
        """
        Apply grayscale conversion, smoothing, thresholding,
        morphological transform, and HSV conversion.
        """
        image = cv2.imread(image_path)
        if image is None:
            raise FileNotFoundError(f"Error: Unable to load image from {image_path}")   
        
        # Add more randomness to preprocessing pipeline
        if self.is_train and random.random() < self.augment_prob:
            # Random brightness and contrast adjustment
            alpha = 1.0 + random.uniform(-0.3, 0.3)  # Contrast control
            beta = random.uniform(-30, 30)  # Brightness control
            image = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
            
            # Random blur levels
            if random.random() < 0.3:
                kernel_size = random.choice([3, 5, 7])
                image = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply Gaussian smoothing
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Otsu's Thresholding
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Morphological Transform
        kernel = np.ones((3, 3), np.uint8)
        morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        # Bitwise AND operation to retain color
        result = cv2.bitwise_and(image, image, mask=morph)

        # Convert to HSV color space
        hsv = cv2.cvtColor(result, cv2.COLOR_BGR2HSV)

        # Convert to PIL format for torchvision transforms
        return Image.fromarray(cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB))

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        image_path = self.image_paths[idx]
        label = self.labels[idx]

        # Preprocess the image
        image = self.preprocess_image(image_path)

        if self.transform:
            image = self.transform(image)

        return image, label


class MixupTransform:
    """Mixup augmentation for training"""
    def __init__(self, alpha=0.2):
        self.alpha = alpha
        
    def __call__(self, batch):
        images, labels = batch
        batch_size = len(images)
        
        # Sample lambda from beta distribution
        lam = np.random.beta(self.alpha, self.alpha)
        
        # Create random indices for mixing
        index = torch.randperm(batch_size)
        
        # Mix images
        mixed_images = lam * images + (1 - lam) * images[index]
        
        # Return mixed images and both sets of labels with lambda
        return mixed_images, labels, labels[index], lam


def train_model(model, train_loader, val_loader=None, criterion=None, optimizer=None, 
               scheduler=None, num_epochs=10, device="cpu", patience=5, mixup=None):
    """
    Train the ResNet-50 model with the preprocessed dataset.
    Includes early stopping and model checkpoint saving.
    """
    model.to(device)
    
    best_val_loss = float('inf')
    best_val_acc = 0.0
    counter = 0
    best_model_path = "best_leaf_model.pth"
    
    # Dictionary to store training history
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': []
    }
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for i, data in enumerate(train_loader):
            # Apply mixup if provided
            if mixup is not None and random.random() < 0.5:  # Apply to 50% of batches
                images, labels_a, labels_b, lam = mixup((data[0], data[1]))
                images, labels_a, labels_b = images.to(device), labels_a.to(device), labels_b.to(device)
                
                # Forward pass
                outputs = model(images)
                
                # Mixup loss
                loss = lam * criterion(outputs, labels_a) + (1 - lam) * criterion(outputs, labels_b)
                
                # For accuracy calculation, use the dominant label
                labels = labels_a if lam >= 0.5 else labels_b
            else:
                images, labels = data
                images, labels = images.to(device), labels.to(device)
                
                # Forward pass
                outputs = model(images)
                loss = criterion(outputs, labels)

            # Backpropagation
            optimizer.zero_grad()
            loss.backward()
            
            # Gradient clipping to prevent exploding gradients
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()

            running_loss += loss.item()
            
            # Calculate training accuracy
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

            # Print batch progress
            if i % 10 == 0:
                print(f"Epoch [{epoch+1}/{num_epochs}], Batch [{i}/{len(train_loader)}], "
                      f"Loss: {loss.item():.4f}")

        train_loss = running_loss/len(train_loader)
        train_acc = 100 * correct / total
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        
        print(f"Epoch [{epoch+1}/{num_epochs}], Training Loss: {train_loss:.4f}, Training Accuracy: {train_acc:.2f}%")
        
        # Validation phase
        if val_loader:
            model.eval()
            val_loss = 0.0
            correct = 0
            total = 0
            
            # Track per-class accuracy for validation
            class_correct = list(0. for _ in range(len(train_loader.dataset.dataset.classes)))
            class_total = list(0. for _ in range(len(train_loader.dataset.dataset.classes)))
            
            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(device), labels.to(device)
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    val_loss += loss.item()
                    
                    _, predicted = torch.max(outputs.data, 1)
                    total += labels.size(0)
                    correct += (predicted == labels).sum().item()
                    
                    # Calculate per-class accuracy
                    c = (predicted == labels).squeeze()
                    for i in range(labels.size(0)):
                        label = labels[i]
                        class_correct[label] += c[i].item()
                        class_total[label] += 1
            
            current_val_loss = val_loss/len(val_loader)
            val_acc = 100 * correct / total
            history['val_loss'].append(current_val_loss)
            history['val_acc'].append(val_acc)
            
            print(f"Validation Loss: {current_val_loss:.4f}, Validation Accuracy: {val_acc:.2f}%")
            
            # Print per-class validation accuracy
            for i in range(len(train_loader.dataset.dataset.classes)):
                if class_total[i] > 0:
                    class_acc = 100 * class_correct[i] / class_total[i]
                    print(f"Accuracy of {train_loader.dataset.dataset.classes[i]}: {class_acc:.2f}%")
            
            # Update learning rate with scheduler
            if scheduler is not None:
                if isinstance(scheduler, ReduceLROnPlateau):
                    scheduler.step(current_val_loss)
                else:
                    scheduler.step()
                current_lr = optimizer.param_groups[0]['lr']
                print(f"Current Learning Rate: {current_lr:.6f}")
            
            # Early stopping and model checkpoint
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                best_val_loss = current_val_loss
                counter = 0
                # Save best model
                torch.save(model.state_dict(), best_model_path)
                print(f"Model improved, saving checkpoint!")
            else:
                counter += 1
                print(f"EarlyStopping counter: {counter} out of {patience}")
                if counter >= patience:
                    print(f"Early stopping triggered at epoch {epoch+1}")
                    # Load best model before returning
                    model.load_state_dict(torch.load(best_model_path))
                    return model, history

    # Load best model before returning if we didn't early stop
    if os.path.exists(best_model_path):
        model.load_state_dict(torch.load(best_model_path))
    
    return model, history

if __name__ == "__main__":
    DATA_DIR = "PlantVillage/train"  # Root directory for training images
    VAL_DIR = None  # We'll split the training data instead of using a separate validation set
    
    # Define transformations with stronger augmentation for training
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),  # Larger resize before crop
        transforms.RandomCrop(224),     # Random crop
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(30),  # More aggressive rotation
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),  # Translation and scaling
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),  # More color variation
        transforms.RandomGrayscale(p=0.05),  # Occasional grayscale
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.2)),  # Random erasing for occlusion robustness
    ])
    
    # Less aggressive transformations for validation
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Create the full dataset
    full_dataset = LeafDataset(DATA_DIR, transform=None, is_train=True)
    
    # Split into train and validation sets (80/20 split)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    # Apply transformations
    class TransformedSubset(Dataset):
        def __init__(self, subset, transform=None):
            self.subset = subset
            self.transform = transform
            self.dataset = subset.dataset
            
        def __getitem__(self, idx):
            image, label = self.subset[idx]
            if isinstance(image, str):  # If image is a path
                image = self.dataset.preprocess_image(image)
            if self.transform:
                image = self.transform(image)
            return image, label
            
        def __len__(self):
            return len(self.subset)
    
    train_dataset = TransformedSubset(train_dataset, train_transform)
    val_dataset = TransformedSubset(val_dataset, val_transform)
    
    # Print dataset sizes
    print(f"Training set size: {len(train_dataset)}")
    print(f"Validation set size: {len(val_dataset)}")
    
    # DataLoaders with more workers for parallel processing
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True, num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False, num_workers=4, pin_memory=True)
    
    # Create mixup transform
    mixup_transform = MixupTransform(alpha=0.2)
    
    # Load ResNet model with weights and modify with deeper regularization
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
    
    # Freeze only first 4 layers instead of 6 to allow more learning
    layers_to_freeze = list(model.children())[:4]  
    for layer in layers_to_freeze:
        for param in layer.parameters():
            param.requires_grad = False
    
    # Add more regularization in the fully connected layers
    num_classes = len(full_dataset.classes)
    model.fc = nn.Sequential(
        nn.Dropout(0.3),  # First dropout layer
        nn.Linear(2048, 1024),
        nn.BatchNorm1d(1024),  # Add batch normalization
        nn.ReLU(),
        nn.Dropout(0.5),  # Second dropout layer
        nn.Linear(1024, num_classes)  # Output layer
    )

    # Loss with label smoothing to prevent overconfidence
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    
    # Optimizer with decoupled weight decay (AdamW instead of Adam)
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.0005, weight_decay=1e-3)
    
    # Learning rate scheduler - cosine annealing for better convergence
    scheduler = CosineAnnealingLR(optimizer, T_max=15, eta_min=1e-6)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Train model with early stopping
    trained_model, history = train_model(
        model=model, 
        train_loader=train_loader, 
        val_loader=val_loader, 
        criterion=criterion, 
        optimizer=optimizer,
        scheduler=scheduler,
        num_epochs=30,  
        device=device,
        patience=10,    # More patience
        mixup=mixup_transform  # Add mixup augmentation
    )
    
    # Save final model
    torch.save(trained_model.state_dict(), "leaf_disease_model_final.pth")
    
    # Save class mapping for inference
    class_mapping = {idx: class_name for idx, class_name in enumerate(full_dataset.classes)}
    torch.save(class_mapping, "class_mapping.pth")
    
    print("Training complete! Final model saved.")
    print(f"Best validation accuracy: {max(history['val_acc']):.2f}%")