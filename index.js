'use strict';
let exec = require('child_process').exec;
var Twitter = require('twitter');
var Slack = require('slack-node');

slack = new Slack();
slack.setWebhook('https://hooks.slack.com/services/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');

var twitterClient = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

exports.tw2slack = (event, context, callback) => {
    if (!event.cmd) {
        return callback('Please specify a command to run as event.cmd');
    }
    const child = exec(event.cmd, (error) => {
        // Resolve with result of process
        callback(error, 'Process complete!');
    });

    slack.webhook({
      username: "webhookbot",
      text: "Test1."
    }, function(err, response) {
      console.log(response);
    });

    // Log process stdout and stderr
    child.stdout.on('data', console.log);
    child.stderr.on('data', console.error);
};
