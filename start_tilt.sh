cd frontend
tilt up &>/dev/null &
cd ../api_server
tilt up --port 12345 &>/dev/null &
