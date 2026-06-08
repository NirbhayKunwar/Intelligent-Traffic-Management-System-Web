import os
import subprocess
import sys

def setup_and_pull():
    # 1. Check if kaggle.json exists in user's home directory
    home = os.path.expanduser("~")
    kaggle_dir = os.path.join(home, ".kaggle")
    kaggle_json = os.path.join(kaggle_dir, "kaggle.json")

    print("=" * 60)
    print("🛰️  Kaggle Kernel Downloader Tool")
    print("=" * 60)

    if not os.path.exists(kaggle_json):
        print(f"❌ Error: API Token file not found at: {kaggle_json}")
        print("\nTo set up your Kaggle API credentials:")
        print("  1. Go to https://www.kaggle.com and log in.")
        print("  2. Go to your Account Settings -> click 'Create New API Token'.")
        print("  3. A file named 'kaggle.json' will download.")
        print(f"  4. Create a folder named '.kaggle' inside your home directory ({kaggle_dir}) and move 'kaggle.json' inside it.")
        print("=" * 60)
        return

    # 2. Try to install the kaggle library
    print("📥 Installing/Verifying 'kaggle' CLI package via pip...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "kaggle"])
        print("✅ Kaggle package verified!")
    except Exception as e:
        print(f"❌ Failed to install kaggle package: {e}")
        return

    # 3. Pull the kernel
    kernel_id = "sarazahran1/real-time-accident-detection-and-traffic-analysis"
    print(f"📥 Pulling Kaggle kernel: {kernel_id}...")
    
    # On Windows, pip packages are installed in the Python Script directory, so we call it through python -m
    try:
        # We can trigger it by importing the api or running kaggle CLI directly
        # Let's run the CLI through subprocess
        subprocess.check_call(["kaggle", "kernels", "pull", kernel_id])
        print(f"\n🎉 Success! The kernel source code has been downloaded successfully to the current directory.")
    except Exception as e:
        # Fallback to calling python module scripts directly
        try:
            print("🔄 Attempting script fallback execution...")
            import kaggle
            kaggle.api.authenticate()
            kaggle.api.kernels_pull_with_http_info(kernel_id, path=".")
            print(f"\n🎉 Success (API Fallback)! The kernel source code has been downloaded.")
        except Exception as api_err:
            print(f"❌ Failed to pull kernel: {api_err}")
    
    print("=" * 60)

if __name__ == "__main__":
    setup_and_pull()
