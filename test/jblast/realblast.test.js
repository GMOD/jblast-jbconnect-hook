var c2x = require('css2xpath');

describe('End-2-End: JBlast - ', function() {

    describe('Submit Blast -', function() {
        
        this.timeout(30000);

        before(function(client, done) {
            console.log(">>> before");
			done();
        });

        after(function(client, done) {
            console.log(">>>after");
          client.end(function() {
            done();
          });
        });

        afterEach(function(client, done) {
            //console.log("afterEach");
          done();
        });

        beforeEach(function(client, done) {
            //console.log("beforeEach");
          done();
        });

        it('should login', function (client) {
            client
                // start the login page and login
                .url('http://localhost:1337/login')
                .waitForElementVisible('body', 1000)
				.pause(1000)
                //.assert.visible('h4.modal-title')
                //.assert.containsText('h4.modal-title', 'JBrowse Login', 'Checking login box title')
                .setValue("input[name='identifier']", ['juser'])
                .setValue("input[name='password']", ['password'])
                .click('button[type="submit"]');
		});
        it('should load JBrowse', function (client) {
            let c1 = client
                // assume already logged in
                // start JBrowse with Example Features track loaded
                .url('http://localhost:1337/jbrowse/?data=sample_data/json/volvox&tracks=DNA,ExampleFeatures&loc=ctgA%3A1..50001')
                .waitForElementVisible('div[widgetid="hierarchicalTrackPane"]',3000)
                .assert.visible('div[widgetid="hierarchicalTrackPane"]')
                .waitForElementVisible('div#label_ExampleFeatures',5000)
                .assert.visible('div#label_ExampleFeatures');
		;
        });
        it('should find feature f08', function (client) {
			client
			    .useXpath()
                .waitForElementVisible(c2x('div.feature-label:contains("f08")+div'),5000)
                .assert.visible(c2x('div.feature-label:contains("f08")+div'))
				;
		});
		
        it('should open Details dialog on feature f08', function (client) {
			client
				.useXpath()
				.click(c2x('div.feature-label:contains("f08")+div'))
				.waitForElementVisible(c2x('span:contains("remarkxx f08")'))
				.assert.visible(c2x('span:contains("remark xxf08")'))
				//.pause(5000)
				;
		});
        it('should click the BLAST button', function (client) {
			client
				.useXpath()
				.waitForElementVisible(c2x('span:contains("BLAST")'))
				.assert.visible(c2x('span:contains("BLAST")'))
				.click(c2x('span:contains("BLAST")'))
				;
		});
        it('should select blast workflow', function (client) {
			client
				.useXpath()
				// look for process Blast dialog
				.waitForElementVisible(c2x('div.dijitDialogTitleBar > span:contains("Process BLAST")'))
				.assert.visible(c2x('div.dijitDialogTitleBar > span:contains("Process BLAST")'))
				.click('#workflow-combo option[value="NCBI.blast"]')
				;
		});
        it('should click workflow Submit', function (client) {
			client
				.useXpath()
				.waitForElementVisible(c2x('span#submit-btn_label:contains("Submit")'))
				.click(c2x('span#submit-btn_label:contains("Submit")'))
				;
		});
        it('should wait for job to complete', function (client) {
			client
				.useXpath()
				.waitForElementVisible(c2x('span:contains("BLAST")'))
				.assert.visible(c2x('span:contains("BLAST")'))
				.click(c2x('span:contains("BLAST")'))
				;
		});
        it('should verify entry created in track selector', function (client) {
			client
				.useXpath()
				.waitForElementVisible(c2x('span:contains("BLAST")'))
				.assert.visible(c2x('span:contains("BLAST")'))
				.click(c2x('span:contains("BLAST")'))
				;
		});
		
    });
});
