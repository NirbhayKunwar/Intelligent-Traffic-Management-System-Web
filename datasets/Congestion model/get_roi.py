import cv2

# We point directly to the video in our folder
video_path = 'test_video.mp4'

cap = cv2.VideoCapture(video_path)
ret, frame = cap.read()
if not ret:
    print("Could not read 'test_video.mp4'. Make sure the name matches perfectly!")
    exit()

# We will save our clicks into this list
points = []

def click_event(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"[{x}, {y}],")
        points.append((x, y))
        # Draw a tiny red circle where you clicked
        cv2.circle(frame, (x, y), 3, (0, 0, 255), -1)
        cv2.imshow("Draw Custom ROI", frame)

cv2.imshow("Draw Custom ROI", frame)
cv2.setMouseCallback("Draw Custom ROI", click_event)

print("-" * 50)
print("Instructions:")
print("1. Click the corners of the road area you want to monitor.")
print("2. When finished, press any key on your keyboard to close the window.")
print("-" * 50)

cv2.waitKey(0)
cv2.destroyAllWindows()

print("-" * 50)
print("Copy these exact coordinates into traffic_counter.py:")
print(points)
print("-" * 50)
