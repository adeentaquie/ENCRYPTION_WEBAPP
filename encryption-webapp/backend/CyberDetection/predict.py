import os
import sys
import joblib

# Get the absolute path to the current script
base_path = os.path.dirname(os.path.abspath(__file__))

# Construct absolute paths to the model and vectorizer files
model_path = os.path.join(base_path, 'model_files', 'bot_model.pkl')
vectorizer_path = os.path.join(base_path, 'model_files', 'vectorizer.pkl')

# Load the model and vectorizer
try:
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
except Exception as e:
    print(f"Error loading model or vectorizer: {e}")
    sys.exit(1)

# Get the input tweet from command-line arguments
if len(sys.argv) < 2:
    print("Error: No tweet provided.")
    sys.exit(1)

tweet = sys.argv[1]

# Predict the tweet's toxicity
try:
    tweet_tfidf = vectorizer.transform([tweet])
    prediction = model.predict(tweet_tfidf)[0]
    print("Harmful" if prediction == 1 else "Safe")
except Exception as e:
    print(f"Error during prediction: {e}")
    sys.exit(1)
