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

      console.log(`maxTweetId: ${maxTweetId}`)

      var attachments = []
      twitterClient.get('search/tweets', {q: 'docbase lang:ja exclude:retweets'}, (error, tweets, response) => {
        for(let i=tweets.statuses.length-1; i>=0; i--){
          let tweet = tweets.statuses[i]

          if(tweet.id_str.length < maxTweetId.length || tweet.id_str.length == maxTweetId.length && tweet.id_str <= maxTweetId) {
            continue
          }
          nextMaxTweetId = tweet.id_str

          let tweetUrl = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
          let attachment = {
            fallback: tweet.text,
            text: tweet.text,
            title: tweetUrl,
            title_link: tweetUrl,
            author_name: `@${tweet.user.screen_name}`,
            author_link: `https://twitter.com/${tweet.user.screen_name}`,
            author_icon: tweet.user.profile_image_url_https,
          }
          if(tweet.entities.media) {
            attachment.image_url = `${tweet.entities.media[0].media_url_https}:small`
            attachment.thumb_url = `${tweet.entities.media[0].media_url_https}:thumb`
          }

          attachments.push(attachment)
        }

        slack.webhook({
          username: 'Twitter',
          text: '',
          icon_emoji: 'https://s3-ap-northeast-1.amazonaws.com/tw2slack/twitter_l.png',
          attachments: attachments
        }, (err, response) => {
          if(err) {
            console.error(err)
            context.done()
          }

          console.log(`nextMaxTweetId: ${nextMaxTweetId}`)
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
        })
      })
    }
  })
}
