const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    WATSON_WORKSPACE_ID,
    WATSON_BLOB,
    CLOUDANT_BLOB,
    TWILIO_FROM_NUMBER,
    GOOGLE_GEOCODING_API_KEY,
    Cloudant,
    AssistantV1,
    twilio,
    client,
    watsonService,
    cloudant,
    conversations,
    storeLocation
} = require('./creds');

const util = require('util')
const Fakerator = require('fakerator');


address = process.argv[2];

state = {
    phone: Fakerator().phone.number(),
    watsonContext: null,
};

console.log("Address: " + address);

storeLocation(state, address).then(() => {
    console.log("Inserting: " + console.log(util.inspect(state, false, null, true /* enable colors */)));

    conversations.insert(state)
      .then(res => {
          console.log("Result: " + res)
      })
      .catch(err => {
          console.error("Erorr: " + err)
      })
});


