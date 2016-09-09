'use strict'

var aws = require('aws-sdk')
var Twitter = require('twitter')
var Slack = require('slack-node')

var slack = new Slack();
slack.setWebhook('https://hooks.slack.com/services/')

var twitterClient = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
})

aws.config.region = 'ap-northeast-1';
var s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.tw2slack = (event, context, callback) => {
  s3.getObject({
    Bucket: 'tw2slack',
    Key: 'max_tweet_id'
  }, (err, data) => {
    if(err) {
      console.error(err)
      context.done()
    }
    else {
      var maxTweetId = data.Body.toString()
      var nextMaxTweetId = maxTweetId
      var newTweets = []

      console.log(`maxTweetId: ${maxTweetId}`)

      twitterClient.get('search/tweets', {q: 'docbase lang:ja exclude:retweets'}, (error, tweets, response) => {
        for(let i=tweets.statuses.length-1; i>=0; i--){
          let tweet = tweets.statuses[i]

          if(tweet.id_str <= maxTweetId) {
            continue
          }
          if(nextMaxTweetId < tweet.id_str) {
            nextMaxTweetId = tweet.id_str
          }

          newTweets.push(tweet)
        }

        console.log(`nextMaxTweetId: ${nextMaxTweetId}`)

        var tweetedCount = 0;
        for(let i=0; i<newTweets.length; i++){
          let tweet = newTweets[i]
          let tweetUrl = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
          console.log(`tweet2slack: ${tweetUrl}`)

          slack.webhook({
            username: `@${tweet.user.screen_name}`,
            text: `\`\`\`\n${tweet.text}\n\`\`\`\n${tweetUrl}`,
            icon_emoji: tweet.user.profile_image_url_https
          }, (err, response) => {
            tweetedCount++
            if(tweetedCount >= newTweets.length){
              s3.putObject({
                Bucket: 'tw2slack',
                Key: 'max_tweet_id',
                ContentType: 'text/plain',
                Body: nextMaxTweetId
              }, (err, data) => {
                if (err) {
                  console.error(err)
                }
                context.done()
              })
            }
          })
        }
      })
    }
  })
}
