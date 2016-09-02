'use strict';
var aws = require('aws-sdk')
var Twitter = require('twitter');
var Slack = require('slack-node');

var slack = new Slack();
slack.setWebhook('https://hooks.slack.com/services/');

var twitterClient = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

exports.tw2slack = (event, context, callback) => {
  twitterClient.get('search/tweets', {q: 'docbase lang:ja'}, function(error, tweets, response) {
    for(let i=0; i<tweets.statuses.length; i++){
      let tweet = tweets.statuses[i];

      slack.webhook({
        username: "@" + tweet.user.screen_name,
        text: "```\n" + tweet.text + "\n```\nhttps://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id,
        icon_emoji: tweet.user.profile_image_url_https
      }, function(err, response) {
        console.log(response);
      });

      break;
    }
  });
};
