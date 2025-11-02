#!/bin/bash

# Add questions to the first marker (Chinatown Street Market)
MARKER_ID="773d5890-d132-4ecd-acb2-8c8d626cb73f"

echo "Adding Question 1 to Chinatown Street Market..."
curl -X POST http://localhost:5001/api/questions \
  -H "Content-Type: application/json" \
  -d "{
    \"routeMarkerId\": \"$MARKER_ID\",
    \"questionText\": \"What type of goods are primarily sold at Chinatown Street Market?\",
    \"questionType\": \"multiple_choice\",
    \"options\": [\"Traditional Chinese goods\", \"Electronics\", \"Clothing\", \"Books\"],
    \"correctAnswer\": \"Traditional Chinese goods\",
    \"orderIndex\": 0,
    \"points\": 10
  }"

echo -e "\n\nAdding Question 2 to Chinatown Street Market..."
curl -X POST http://localhost:5001/api/questions \
  -H "Content-Type: application/json" \
  -d "{
    \"routeMarkerId\": \"$MARKER_ID\",
    \"questionText\": \"Has Chinatown Street Market been a fixture for decades?\",
    \"questionType\": \"true_false\",
    \"options\": [],
    \"correctAnswer\": \"true\",
    \"orderIndex\": 1,
    \"points\": 10
  }"

echo -e "\n\nAdding Question 3 to Chinatown Street Market..."
curl -X POST http://localhost:5001/api/questions \
  -H "Content-Type: application/json" \
  -d "{
    \"routeMarkerId\": \"$MARKER_ID\",
    \"questionText\": \"What can you buy at this market as souvenirs?\",
    \"questionType\": \"text_input\",
    \"options\": [],
    \"correctAnswer\": \"traditional Chinese goods\",
    \"orderIndex\": 2,
    \"points\": 15
  }"

echo -e "\n\n✅ Done! Refresh your game page to see the questions."
