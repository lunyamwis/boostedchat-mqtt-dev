#!/bin/bash
# API_URL='https://api.booksy.us.boostedchat.com'
API_URL='https://623e-41-72-199-199.ngrok-free.app'
threadId="340282366841710301244259314247554546887"
messages=("message1" "message2" "message3")  # Array of messages

# Join messages with '#*eb4*#' separator
joined_messages=$(printf "%s" "${messages[@]}" | tr "\n" "#*eb4*#")

# Make the POST request using cURL
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$joined_messages\"}" \
  "${API_URL}/v1/instagram/dflow/${threadId}/generate-response/"
