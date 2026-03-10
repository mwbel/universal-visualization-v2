import uvicorn
import os
import sys

if __name__ == "__main__":
    # Add project root to sys.path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))

    print("Starting Maosai Tutor Prototype...")
    print("Access the app at http://localhost:8000")
    print("Or use http://127.0.0.1:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
