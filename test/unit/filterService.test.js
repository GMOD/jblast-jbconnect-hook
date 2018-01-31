/*
 * run from app root: 
 * node ./node_modules/mocha/bin/mocha test/filterService.test.js
 */
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.use(require('chai-shallow-deep-equal'));
const assert = chai.assert;
const fs = require('fs-extra');
const shelljs = require('shelljs');

const dataSet = "sample_data/json/volvox";

describe('filterService', function() {
    // if sails is not defined we are outside of sails environment
    /*
    if (typeof sails === 'undefined') {
        console.log('creating mock global sails variable');
        sails = {
            config: 
                require('../data/testGlobals')

        };
    }
    */
    //console.log("config",sails.config.globals.jbrowse);
    
    // copy sample files to the target directory
    let g = sails.config.globals.jbrowse;
    let targetDir = g.jbrowsePath + dataSet +'/'+ g.jblast.blastResultPath;
    fs.ensureDirSync(targetDir);
    
    console.log("copying jblast_sample*.* to",targetDir);
    shelljs.cp('./setup/jblastdata/jblast_sample*.*',targetDir);

    describe("# get() function", () => {
        it('getFilterSettings() should return content of jblast_sample_filtersettings.json', (done) => {
            
            filter.getFilterSettings({asset: 'jblast_sample', dataset: 'sample_data/json/volvox'},function(data) {
                
                let tfile = targetDir+'/jblast_sample_filtersettings.json';
                let content = JSON.parse(fs.readFileSync(tfile,'utf-8'));
                assert.shallowDeepEqual(content,data);
                return done();
            });
        });
        it('getHitDataFiltered() test', (done) => {
            
            let req = {asset: 'jblast_sample', dataset: 'sample_data/json/volvox'};
            filter.getFilterSettings(req,function(filterData) {
                
                filter.getHitDataFiltered(filterData,req,function(data) {
                    assert.shallowDeepEqual({ result: 'success', hits: 792, filteredHits: 792 },data);
                    return done();
                });
                
            });
        });
        it('writeFilterSettings() & applyFilter() test', (done) => {
            
            let req = {
                asset: 'jblast_sample', 
                dataset: 'sample_data/json/volvox',
                filterParams: { score: { val: '256' } },
                noAnnounce: true
            };
            let tfile = targetDir+'/jblast_sample_filtersettings.json';
            let preContent = JSON.parse(fs.readFileSync(tfile,'utf-8'));
            
            filter.writeFilterSettings(req,function(filterData) {
                
                let newContent = JSON.parse(fs.readFileSync(tfile,'utf-8'));
                
                //console.log('filterData',filterData);
                //console.log('content',content);
                //console.log('preContent',preContent);
                
                //assert.shallowDeepEqual(content,preContent);
                assert.shallowDeepEqual(filterData.score,{ type: 'abs', min: 58, max: 593, val: 256 });
                
                filter.applyFilter(filterData,req,function(data) {
                    assert.shallowDeepEqual({ result: 'success', hits: 792, filteredHits: 515 },data);
                    console.log('data',data);
                    return done();
                });
                
            });
        });
    });

});
