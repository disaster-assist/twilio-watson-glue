//Fetch our Twilio Credentials from the .gitignored file
const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    WATSON_WORKSPACE_ID,
    WATSON_BLOB,
    CLOUDANT_BLOB,
    TWILIO_FROM_NUMBER
} = require('./disaster-credentials/credentials');

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
WATSON_BLOB['version'] = '2018-02-16';
let watsonService = new AssistantV1(WATSON_BLOB);

//Initialize Cloudant connection
const cloudant = Cloudant(CLOUDANT_BLOB);
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

    //Since this code was written for a hackathon, it's not quite "production ready".
    //This promise wraps our chain of indented callback functions.
    return new Promise((resolve, reject) => {
        //Query Cloudant for our state information
        return conversations.find({
            selector: {
                phone: params.From
            }
        }, function (err, data) {
            if (err) throw err;

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

            //Push our request into Watson assistant to generate a textual response
            // and a new conversation state
            return watsonService.message({
                input: {text: params.Body},
                workspace_id: WATSON_WORKSPACE_ID,
                context: state.watsonContext
            }, function (watsonErr, watsonResponse) {
                if (watsonErr) throw watsonErr;

                state.watsonContext = watsonResponse.context;

                //Insert the new conversation state into Cloudant
                return conversations.insert(state, function (newErr, newResult) {
                    if (newErr) throw err;

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
                            .then((resp) => {
                                console.log("Message sent! " + resp)
                                resolve({
                                    headers: {
                                        'Content-Type': 'text/xml',
                                    },
                                    statusCode: 200,
                                    body: ''
                                });
                            })
                            .catch((err) => {
                                console.err("Error: " + err);
                                throw err
                            });
                    } else {
                        return reject('no watson response');
                    }
                })
            });


        });
    });


};

module.exports = {
    main
};

global.main = main;
