//Fetch our Twilio Credentials from the .gitignored file
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

var _ = require('underscore');

//Default values for when we invoke this locally on test machines
const DEFAULT_NUMBER = '+17205562453';
const DEFUALT_BODY = "E Complex RPI Troy NY";

function asBool(envVar, defaultVal) {
    return (process.env[envVar]!==undefined) ? JSON.parse(process.env[envVar].toLowerCase()) : defaultVal;
}

const USE_TWILIO = asBool("USE_TWILIO", true);

const RECEIVED_LOCATION = 'ReceivedLocation';

const {store_location} = require('./creds');

function parseWatsonResponse(watsonResponse, state) {
    state.watsonContext = watsonResponse.context;
    if (!!watsonResponse.context.the_location) {
        console.log("Got location: " + watsonResponse.input.text);

        delete watsonResponse.context.the_location;

        return storeLocation(state, watsonResponse.input.text);
    }
    return Promise.resolve({})
}

function sendSMS(params, message) {
    if (USE_TWILIO) {
        return client.messages
          .create({
                      to: params.From,
                      from: TWILIO_FROM_NUMBER,
                      body: message,
                  })
    } else {
        return Promise.resolve({})
    }

}

/**
 * main()
 *
 * function
 *
 * the OpenWhisk application that glues Twilio to our Watson Assistant
 *
 * NOT PRODUCTION QUALITY
 *  - This code was written for a 24 hour hackathon
 */
function main(params) {
    //Use default values if we're using this on our test machines
    if (params.From == null) {
        params.From = DEFAULT_NUMBER;
        params.Body = DEFUALT_BODY;
    }

    console.log("Using Twilio: " + USE_TWILIO);


    return conversations.find({
                                  selector: {
                                      phone: params.From
                                  }
                              }
    ).then((data) => {
        //If Cloudant had a conversation state for us, use it.
        // If not, instatiate a new one
        let state;
        if (data.docs.length === 1) {
            state = data.docs[0];
        } else {
            state = {
                phone: params.From,
                watsonContext: null
            }
        }
        return state;
    }).then(state => {
        return new Promise(function(resolve, reject) {
            watsonService.message(
              {
                  input: {text: params.Body},
                  workspace_id: WATSON_WORKSPACE_ID,
                  context: state.watsonContext
              },
              function(watsonErr, watsonResponse)  {
                  if (watsonErr != null) {
                      reject(watsonErr)
                  } else {
                      resolve(watsonResponse)
                  }
              })
        })
          .then(watsonResponse => {
              return {
                  state: state,
                  watsonResponse: watsonResponse
              }
          })
    }).then(data => {
        watsonResponse = data.watsonResponse;
        console.log('Updated state document');

        console.log("Watson context: " + watsonResponse.context);
        console.log('Watson response:');
        for (let message of watsonResponse.output.text) {
            console.log(message);
        }

        return parseWatsonResponse(watsonResponse, data.state)
          .then(() => {
              return conversations.insert(data.state)
                .then(_ => watsonResponse);
          })
    }).then(watsonResponse => {
        //Send the response from Watson Assistant back to the sender
        // via the Twilio API

        let textResponse = 'Got an empty response from Watson!';
        if (watsonResponse.output.text.length > 0) {
            textResponse = watsonResponse.output.text.join("\n");
        }

        return sendSMS(params, textResponse)


    }).then((resp) => {
        console.log("Message sent! " + resp);
        return {
            headers: {
                'Content-Type': 'text/xml',
            },
            statusCode: 200,
            body: ''
        };
    }).catch(err => {
        console.log("Error occurred: " + err);

        return sendSMS(params, "An internal error occured: " + err)
          .then(resp => {
              console.error("Send error text message to " + params.From);
          })

        return client.messages
          .create({
                      to: params.From,
                      from: TWILIO_FROM_NUMBER,
                      body: "An internal error occured: " + err
                  })
          .then(resp => {
              console.error("Send error text message to " + params.From);
          })
    })
}

module.exports = {
    main: main
};

global.main = main;
