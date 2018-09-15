//Fetch our Twilio Credentials from the .gitignored file
const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    WATSON_USERNAME,
    WATSON_PASSWORD,
    WATSON_WORKSPACE_ID
} = require('./credentials');

const AssistantV1 = require('watson-developer-cloud/assistant/v1');

//Require the Twilio module and create a REST client
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Hello world as an OpenWhisk action.
 */
function main(params) {
    return client.messages
        .create({
            to: '+17205562453',
            from: '+18508765124',
            body: "Tomorrow's forecast in Financial District, San Francisco is Clear",
            mediaUrl: 'https://climacons.herokuapp.com/clear.png',
        });

    // Set up Assistant service wrapper.
    let service = new AssistantV1({
        username: WATSON_USERNAME, // replace with service username
        password: WATSON_PASSWORD, // replace with service password
        url: 'https://gateway.watsonplatform.net/assistant/api',
        version: '2018-02-16'
    });

    // Start conversation with empty message.
    service.message({
        input: {text: "What time is it"},
        workspace_id: WATSON_WORKSPACE_ID
    }, processResponse);

    // Process the service response.
    function processResponse(err, response) {
        if (err) {
            console.error(err); // something went wrong
            return;
        }

        // Display the output from dialog, if any.
        if (response.output.text.length !== 0) {
            console.log(response.output.text[0]);
        }
    }

}

module.exports = {
    main
};