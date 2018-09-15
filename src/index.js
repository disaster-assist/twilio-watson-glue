//Fetch our Twilio Credentials from the .gitignored file
const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    WATSON_USERNAME,
    WATSON_PASSWORD,
    WATSON_WORKSPACE_ID,
    CLOUDANT_BLOB
} = require('./credentials');

const Cloudant = require('@cloudant/cloudant');
const AssistantV1 = require('watson-developer-cloud/assistant/v1');

//Require the Twilio module and create a REST client
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Hello world as an OpenWhisk action.
 */
function main(params) {

    // Set up Assistant service wrapper.
    let service = new AssistantV1({
                                      username: WATSON_USERNAME, // replace with service username
                                      password: WATSON_PASSWORD, // replace with service password
                                      url: 'https://gateway.watsonplatform.net/assistant/api',
                                      version: '2018-02-16'
                                  });

    var cloudant = Cloudant(CLOUDANT_BLOB);
    var conversations = cloudant.db.use('conversations');
    conversations.find({"selector": {
        "phone": 16034653947
        }}, function(err, data) {

        if (err != null) {
            throw err;
        }

        service.message({
                            input: {text: "What time is it"},
                            workspace_id: WATSON_WORKSPACE_ID
                        }, function(watsonErr, watsonResponse) {


            if (err) {
                console.error(err); // something went wrong
                return;
            }

            console.log("Watson response:");
            for (var message of watsonResponse.output.text) {
                console.log(message)
            }

            var doc;
            if (data.docs.length === 1) {
                doc = data.docs[0];
            } else {
                doc = {
                    "phone": 16034653947,
                    "watson-context": null
                }
            }
            doc["watson-context"] = watsonResponse.context;

            conversations.insert(doc, function(newErr, newResult) {
                console.log("Updated document")
            })
        });


    });
    /*var result = conversations.insert({'phone': '16034653947', 'watson-context': 'test'}, function(err, result) {
        console.log("Inserted: " + err + result);

        return client.messages
          .create({
                      to: '+17205562453',
                      from: '+18508765124',
                      body: "Tomorrow's forecast in Financial District, San Francisco is Clear",
                      mediaUrl: 'https://climacons.herokuapp.com/clear.png',
                  });
    });*/


}

module.exports = {
    main
};

global.main = main
