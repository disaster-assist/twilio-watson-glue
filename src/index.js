//Fetch our Twilio Credentials from the .gitignored file
const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    WATSON_WORKSPACE_ID,
    WATSON_BLOB,
    CLOUDANT_BLOB,
    TWILIO_FROM_NUMBER
} = require('./disaster-credentials/credentials');

var _ = require('underscore');

//Default values for when we invoke this locally on test machines
const DEFAULT_NUMBER = '+17205562453';
const DEFUALT_BODY = "Hi";

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
        return conversations.insert(data.state)
          .then(_ => data.watsonResponse)
    }).then(watsonResponse => {
        console.log('Updated state document');

        console.log('Watson response:');
        for (let message of watsonResponse.output.text) {
            console.log(message);
        }

        //Send the response from Watson Assistant back to the sender
        // via the Twilio API
        if (watsonResponse.output.text.length > 0) {
            return client.messages
              .create({
                          to: params.From,
                          from: TWILIO_FROM_NUMBER,
                          body: watsonResponse.output.text.join("\n"),
                      })
        }
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
        console.log("Error occurred!");

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
    main
};

global.main = main;
