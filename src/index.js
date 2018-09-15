//Fetch our Twilio Credentials from the .gitignored file
const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    WATSON_USERNAME,
    WATSON_PASSWORD,
    WATSON_WORKSPACE_ID,
    CLOUDANT_BLOB,
    TWILIO_FROM_NUMBER
} = require('./disaster-credentials/credentials');

const Cloudant = require('@cloudant/cloudant');
const AssistantV1 = require('watson-developer-cloud/assistant/v1');

//Require the Twilio module and create a REST client
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Set up Assistant watsonService wrapper.
let watsonService = new AssistantV1({
    username: WATSON_USERNAME, // replace with watsonService username
    password: WATSON_PASSWORD, // replace with watsonService password
    url: 'https://gateway.watsonplatform.net/assistant/api',
    version: '2018-02-16'
});

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
    return new Promise((resolve, reject) => {
        //Query Cloudant for our state information
        return conversations.find({
            selector: {
                phone: 16034653947
            }
        }, function (err, data) {
            if (err) throw err;

            let state;
            if (data.docs.length === 1) {
                state = data.docs[0];
            } else {
                state = {
                    phone: 16034653947,
                    watsonContext: null
                }
            }

            return watsonService.message({
                input: {text: 'What time is it'},
                workspace_id: WATSON_WORKSPACE_ID,
                context: state.watsonContext
            }, function (watsonErr, watsonResponse) {
                if (watsonErr) throw err;

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
                                to: '+17205562453',
                                from: TWILIO_FROM_NUMBER,
                                body: 'Tomorrow\'s forecast in Financial District, San Francisco is Clear',
                                mediaUrl: 'https://climacons.herokuapp.com/clear.png',
                            })
                            .then(() => {
                                return resolve();
                            }, (err) => {
                                return reject(err);
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
