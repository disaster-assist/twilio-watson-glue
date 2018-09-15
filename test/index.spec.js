const app = require('../src/index');
const expect = require('chai').expect;

describe('twilio-watson-glue', () => {
    describe('main()', () => {
        it('should exist', () => {
            expect(app.main).to.exist;
        });
    });
});