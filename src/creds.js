const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    WATSON_WORKSPACE_ID,
    WATSON_BLOB,
    CLOUDANT_BLOB,
    TWILIO_FROM_NUMBER,
    GOOGLE_GEOCODING_API_KEY
} = require('./disaster-credentials/credentials');

const _ = require('underscore');
//Pull in required libraries
const Cloudant = require('@cloudant/cloudant');
const AssistantV1 = require('watson-developer-cloud/assistant/v1');
const twilio = require('twilio');

//Initialize the Twilio module and create a REST client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

//Initialize Assistant Watson Service wrapper
let watsonService = new AssistantV1(_.extend(WATSON_BLOB, {'version': '2018-02-16'}));

//Initialize Cloudant connection
const cloudant = Cloudant(_.extend(CLOUDANT_BLOB, {'plugins': 'promises'}));
const conversations = cloudant.db.use('conversations');

var googleMapsClient = require('@google/maps').createClient(
  {
      key: GOOGLE_GEOCODING_API_KEY,
      Promise: Promise
  });

function storeLocation(state, rawLocation) {
    state.location_date = new Date().getTime();
    state.raw_location = rawLocation;
    return googleMapsClient.geocode({ address: state.raw_location})
      .asPromise()
      .then(resp => {
          state.parsed_location = resp
      })
}

module.exports = {
    Cloudant: Cloudant,
    AssistantV1: AssistantV1,
    twilio: twilio,
    client: client,
    watsonService: watsonService,
    cloudant: client,
    conversations: conversations,
    WATSON_WORKSPACE_ID: WATSON_WORKSPACE_ID,
    TWILIO_FROM_NUMBER: TWILIO_FROM_NUMBER,
    storeLocation: storeLocation
}
