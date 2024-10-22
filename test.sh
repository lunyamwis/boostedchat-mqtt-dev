#!/bin/bash
# API_URL='https://api.booksy.us.boostedchat.com'
API_URL='https://api.jamel.boostedchat.com'
# API_URL='http://localhost:8000'
# API_URL='https://623e-41-72-199-199.ngrok-free.app'
# threadId="340282366841710301244259314247554546887" # for booksy
threadId="340282366841710301244276108812127893264"
# messages=("Hi. Did you get my previous message?")  # Array of messages
messages=("message1#*eb4*#message2" "message3")  # Array of messages


# Join messages with '#*eb4*#' separator
joined_messages=$(printf "%s" "${messages[@]}" | tr "\n" "#*eb4*#")
echo $joined_messages
# Make the POST request using cURL
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$joined_messages\"}" \
  "${API_URL}/v1/instagram/dflow/${threadId}/generate-response/"



# message1#*eb4*#message2message3
# {"fulfillment_response":{"messages":[{"text":{"error":"Expecting value: line 1 column 1 (char 0)"}}]}}i