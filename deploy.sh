#!bin/bash
echo "Building for production ..."
npm run build;

echo "Copying to raspi"
ssh -l pi 192.168.2.159 "rm -rf /home/pi/static/apps/pomodoro";
scp -r ./dist pi@192.168.2.159:/home/pi/static/apps/pomodoro;

echo "Done."
exit 0;