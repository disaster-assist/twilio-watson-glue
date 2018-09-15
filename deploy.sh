set -e

npx webpack
ibmcloud fn action update twilio-watson-glue dist/main.js

#source ./secrets.sh
#bx wsk action update image-upload ./dist/main.js --web raw -p GITHUB_TOKEN $GITHUB_TOKEN -p IMGUR_TOKEN "$IMGUR_TOKEN"
