#!/usr/bin/env bash

# The cleanup function sets down server upon exit
function cleanup {
  # use printf so we can newline away from the ^C, echo won't always behave as expected
  printf "\nShutting Computable server process $server_pid."
  kill -9 $server_pid
}

trap cleanup EXIT

# Start background server
node server.js&
server_pid=$!
echo "Started Computable server at process $server_pid"
echo "Waiting 3 seconds for server to start"
sleep 3
echo "Starting Computable Repl"
node repl.js
