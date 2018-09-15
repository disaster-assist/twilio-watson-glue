//Fetch our Twilio Credentials from the .gitignored file
const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    WATSON_WORKSPACE_ID,
    WATSON_BLOB,
    CLOUDANT_BLOB,
    TWILIO_FROM_NUMBER
} = require('./disaster-credentials/credentials');

const Cloudant = require('@cloudant/cloudant');
const AssistantV1 = require('watson-developer-cloud/assistant/v1');

const DEFAULT_NUMBER = '+17205562453';
const DEFUALT_BODY = "Hi";

//Require the Twilio module and create a REST client
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Set up Assistant watsonService wrapper.
WATSON_BLOB['version'] = '2018-02-16';
let watsonService = new AssistantV1(WATSON_BLOB);

const cloudant = Cloudant(CLOUDANT_BLOB);
const conversations = cloudant.db.use('conversations');

/**
 * main()
 *
 * function
 *
 * the OpenWhisk application that glues Twilio to our Watson Assistant
 */
function main(params) {
    if (params.From == null) {
        params.From = DEFAULT_NUMBER;
        params.Body = DEFUALT_BODY;
    }

    return new Promise((resolve, reject) => {
        //Query Cloudant for our state information
        return conversations.find({
            selector: {
                phone: params.From
            }
        }, function (err, data) {
            if (err) throw err;

            let state;
            if (data.docs.length === 1) {
                state = data.docs[0];
            } else {
                state = {
                    phone: params.From,
                    watsonContext: null
                }
            }

            return watsonService.message({
                input: {text: params.Body},
                workspace_id: WATSON_WORKSPACE_ID,
                context: state.watsonContext
            }, function (watsonErr, watsonResponse) {
                if (watsonErr) throw watsonErr;

                state.watsonContext = watsonResponse.context;

                return conversations.insert(state, function (newErr, newResult) {
                    if (newErr) throw err;

                    console.log('Updated state document');

                    console.log('Watson response:');
                    for (let message of watsonResponse.output.text) {
                        console.log(message);
                    }

                    if (watsonResponse.output.text.length > 0) {
                        client.messages
                            .create({
                                to: params.From,
                                from: TWILIO_FROM_NUMBER,
                                body: watsonResponse.output.text.join("\n"),
                            })
                            .then((resp) => {
                                console.log("Message sent! " + resp)
                                resolve()
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
