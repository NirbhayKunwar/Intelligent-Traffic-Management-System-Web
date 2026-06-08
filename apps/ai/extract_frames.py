import os
import cv2
import argparse

def extract_frames(video_path, output_dir, frame_stride=10):
    """
    Extracts frames from a video file at a set interval.
    
    Parameters:
    - video_path (str): Path to the input video file (or a directory of videos).
    - output_dir (str): Directory where extracted images will be saved.
    - frame_stride (int): Extract every N-th frame (e.g. 10 means 1 frame per 10 frames).
                          This prevents generating thousands of redundant, identical images.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"📁 Created output directory: {output_dir}")

    # Support directories as input
    video_files = []
    if os.path.isdir(video_path):
        for file in os.listdir(video_path):
            if file.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
                video_files.append(os.path.join(video_path, file))
        print(f"🔍 Found {len(video_files)} videos in directory: {video_path}")
    else:
        if os.path.exists(video_path):
            video_files.append(video_path)
        else:
            print(f"❌ Input video path does not exist: {video_path}")
            return

    total_images = 0
    for video in video_files:
        video_name = os.path.splitext(os.path.basename(video))[0]
        print(f"🎞️ Processing video: {os.path.basename(video)}")
        
        cap = cv2.VideoCapture(video)
        if not cap.isOpened():
            print(f"  ❌ Cannot open video: {video}")
            continue

        frame_count = 0
        extracted_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_stride == 0:
                img_name = f"{video_name}_frame_{frame_count:06d}.jpg"
                img_path = os.path.join(output_dir, img_name)
                cv2.imwrite(img_path, frame)
                extracted_count += 1
                total_images += 1
            
            frame_count += 1

        cap.release()
        print(f"  ✅ Extracted {extracted_count} frames from {frame_count} total frames.")

    print("=" * 60)
    print(f"🎉 Success! Extracted a total of {total_images} images into '{output_dir}'.")
    print("Next step: Upload these images to Roboflow.com to annotate them.")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract raw image frames from video files for YOLO training")
    parser.add_argument("--input", type=str, required=True, help="Path to video file or directory containing videos")
    parser.add_argument("--output", type=str, default="dataset_raw", help="Directory to save extracted frames")
    parser.add_argument("--stride", type=int, default=15, help="Extract 1 frame per N frames")
    
    args = parser.parse_args()
    extract_frames(args.input, args.output, args.stride)
