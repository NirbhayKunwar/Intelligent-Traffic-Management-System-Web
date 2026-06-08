import os
import argparse
from ultralytics import YOLO

def train_model(data_yaml, epochs=100, batch_size=16, img_size=640, model_size="s"):
    """
    Trains a custom YOLOv8 model for accident and collision detection.
    
    Parameters:
    - data_yaml (str): Path to the dataset configuration YAML file (e.g., 'dataset.yaml').
    - epochs (int): Number of training epochs.
    - batch_size (int): Batch size for training (adjust based on GPU VRAM).
    - img_size (int): Input image resolution (640 is standard; 1280 offers higher accuracy for distant objects).
    - model_size (str): YOLOv8 model size: 'n' (nano), 's' (small), 'm' (medium), 'l' (large), 'x' (xlarge).
    """
    print("=" * 60)
    print(f"🚀 ITMS Custom AI Training Pipeline Initiated")
    print(f"• Dataset configuration: {data_yaml}")
    print(f"• Epochs: {epochs}")
    print(f"• Batch size: {batch_size}")
    print(f"• Image size: {img_size}x{img_size}")
    print(f"• Model backbone: yolov8{model_size}.pt")
    print("=" * 60)

    # 1. Load the pre-trained base model weights (Transfer Learning)
    base_model_name = f"yolov8{model_size}.pt"
    print(f"📥 Downloading/Loading base weights: {base_model_name}")
    model = YOLO(base_model_name)

    # 2. Kick off training
    # - device=0 runs on first CUDA GPU. If no GPU is available, it defaults to CPU.
    # - mosaic=1.0 and mixup=0.1 enable advanced data augmentations for complex accident scenes.
    model.train(
        data=data_yaml,
        epochs=epochs,
        batch=batch_size,
        imgsz=img_size,
        device=0 if os.environ.get("CUDA_VISIBLE_DEVICES") or os.system("nvidia-smi > nul 2>&1") == 0 else "cpu",
        workers=4,
        save=True,
        project="itms_training",
        name=f"accident_yolov8{model_size}",
        exist_ok=True,
        # Augmentation settings to make the model robust to lighting and weather conditions:
        degrees=10.0,
        flipud=0.5,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.15
    )

    print("\n✅ Training Complete!")
    print(f"Check your 'itms_training/accident_yolov8{model_size}/weights/best.pt' for the final trained model.")
    print("Move this file to 'apps/ai/models/Accident model/best.pt' to run it in the ITMS dashboard.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a custom YOLOv8 model for ITMS")
    parser.add_argument("--data", type=str, required=True, help="Path to data.yaml dataset config file")
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size (e.g. 8, 16, 32)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size (640 or 1280)")
    parser.add_argument("--size", type=str, default="s", choices=["n", "s", "m", "l", "x"], help="Model size backbone")
    
    args = parser.parse_args()
    
    train_model(
        data_yaml=args.data,
        epochs=args.epochs,
        batch_size=args.batch,
        img_size=args.imgsz,
        model_size=args.size
    )
