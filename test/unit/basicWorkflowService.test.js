/*
 * run from app root: 
 * node ./node_modules/mocha/bin/mocha test/basicWorkflowService.test.js
 */
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.use(require('chai-shallow-deep-equal'));
var assert = chai.assert;

// if sails is not defined we are outside of sails environment
if (typeof sails === 'undefined') {
    sails = {
        config: 
            require('../data/testGlobals')

    };
}

describe('basicWorkflowService', function() {

    describe("# determineBlastProfile() function", () => {
        let basicWorkflowService = require('../../api/services/basicWorkflowService');
        let g = sails.config.globals.jbrowse;
        //console.log("config",sails.config);
        
        it('determineBlastProfile - no blastProfile defined', (done) => {
            // dummy data
            let kJob = {
                data: {},
                kDoneFn (val) {
                    return;
                }
            };
            basicWorkflowService.determineBlastProfile(kJob);
            //console.log("kJob result",kJob);
            assert.shallowDeepEqual(g.jblast.blastProfiles[g.jblast.defaultBlastProfile],kJob.data.blastOptions);
            done();
        });
        it('determineBlastProfile - blastProfile = htgs', (done) => {
            // dummy data
            let kJob = {
                data: { blastProfile: 'htgs' },
                kDoneFn (val) {
                    return;
                }
            };
            basicWorkflowService.determineBlastProfile(kJob);
            //console.log("kJob result",kJob);
            assert.shallowDeepEqual(g.jblast.blastProfiles['htgs'],kJob.data.blastOptions);
            done();
        });
        it('determineBlastProfile - blastProfile = user supplied profile', (done) => {
            // dummy data
            let kJob = {
                data: { 
                    blastProfile: {
                        db: "/123/1bc",
                        lnpm: "x",
                        xxaabb: 23,
                        x21: -2
                    }
                },
                kDoneFn (val) {
                    return;
                }
            };
            basicWorkflowService.determineBlastProfile(kJob);
            //console.log("kJob result",kJob);
            assert.shallowDeepEqual(kJob.data.blastProfile,kJob.data.blastOptions);
            done();
        });
    });
});
