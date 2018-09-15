# twilio-watson-glue

[![Build Status](https://travis-ci.org/disaster-assist/twilio-watson-glue.svg?branch=master)](https://travis-ci.org/disaster-assist/twilio-watson-glue)

This repository is intended to receive incoming webhook requests from Twilio via the IBM API Gateway then forward them into Watson.

This repository was built for the 2018 IBM Call for Code hackathon.

### Diagram
![Diagram](art/Diagram.png)

### Using this repository

Use yarn commands to deploy and manage this repository on IBM Bluemix.

These commands require for you to have installed and logged in to the IBM Bluemix command line.

- `deploy:create` - Builds and creates the function on IBM Bluemix
- `deploy:update` - Builds then updates the function on IBM Bluemix
- `deploy:invoke` - Invokes the function on IBM Bluemix
- `deploy:upvoke` - Builds then updates then invokes the function on IBM Bluemix
- `deploy:delete` - Deletes the function on IBM Bluemix

### Submodules

The credentials for deploying and running this repository are stored in a Git submodule.

### Contributers

- Shweta Burgus - Student at RPI
- Jake Billings - Freelance Developer and Student at RPI
- Aaron Hill - Student at RPI
- Michael Jones - Student at RPI

### Original Concept
![artboard](art/artboard.JPG)

### More

Powered by [Rensselaer Center for Open Source](http://rcos.io) and IBM. See more at the RCOS [https://github.com/rcos](https://github.com/rcos).

