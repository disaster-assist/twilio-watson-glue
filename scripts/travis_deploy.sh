bx login -a https://api.ng.bluemix.net
bx target --cf-api https://api.ng.bluemix.net -o Disaster-Assist -s dev
npm run deploy:update
