var AssistantV1 = require('watson-developer-cloud/assistant/v1');

/**
 * Hello world as an OpenWhisk action.
 */
function main(params) {
  var name = params.name || 'World';

  // Set up Assistant service wrapper.
  var service = new AssistantV1({
                                  username: params.WATSON_USERNAME, // replace with service username
                                  password: params.WATSON_PASSWORD, // replace with service password
                                  url: 'https://gateway.watsonplatform.net/assistant/api',
                                  version: '2018-02-16'
                                });

  var workspace_id = 'fc7d0a6d-6952-4377-a7fd-85d5b79f10cb'; // replace with workspace ID

  // Start conversation with empty message.
  service.message({
                    input: {text: "What time is it"},
                    workspace_id: workspace_id
                  }, processResponse);

  // Process the service response.
  function processResponse(err, response) {
    if (err) {
      console.error(err); // something went wrong
      return;
    }

    // Display the output from dialog, if any.
    if (response.output.text.length != 0) {
      console.log(response.output.text[0]);
    }
  }
}

exports.main = main(process.env)
