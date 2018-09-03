const express = require('express')
const router = express.Router()
const con = require('../../../../helpers/mysql')

// we will generate permlink and json_metadata for submitted post
// then we will submit that post to the database with publish time
router.post('/', async (req, res) => {
  const username = req.cookies.username
  const date = req.body.date
  const title = req.body.title
  const content = req.body.content
  const tags = req.body.tags
  const rewardsType = req.body.rewardstype
  const upvotePost = req.body.upvotepost
  if (username && date && title && content && tags && rewardsType && upvotePost) {
    // checking parameters
    const error = isError(date, tags, rewardsType, upvotePost)
    if (!error) {
      const permlink = createPermlink(title)
      // creating json_metadata
      const jsonMetadata = '{"tags":' + JSON.stringify(tags) + ',"links":[],"app":"steemauto/0.02","format":"markdown"}'
      // post will published at the postDate
      const nowDate = new Date()
      const nowSec = nowDate.getTime() / 1000
      const now = Math.floor(nowSec)
      const postDate = now + (date * 3600)
      await con.query(
        'INSERT INTO `posts`(`user`, `title`, `content`, `date`,`maintag`, `json`, `permlink`, `upvote`, `rewards`)' +
        'VALUES (?,?,?,?,?,?,?,?,?)',
        [username, title, content, postDate, tags[0], jsonMetadata, permlink, upvotePost, rewardsType]
      )
      res.json({
        id: 1,
        result: 'Successfully submitted'
      })
    } else {
      res.json({
        id: 0,
        error: 'wrong params'
      })
    }
  } else {
    res.json({
      id: 0,
      error: 'required params missed'
    })
  }
})

// this function will return true(1) if params was not in the expected format
const isError = (date, tags, rewardsType, upvotePost) => {
  if (!isNaN(date) && !isNaN(rewardsType) && !isNaN(upvotePost) && Array.isArray(tags)) {
    // date should be between 1 and 168 hours (7days)
    if (date < 1 && date > 168) {
      return 1
    }
    // 0: default 50/50, 1: 100% powerup, 2: decline payout
    if (rewardsType !== 0 && rewardsType !== 1 && rewardsType !== 2) {
      return 1
    }
    // 0: don't upvote, 1: upvote after publishing
    if (upvotePost !== 0 && upvotePost !== 1) {
      return 1
    }
    // we accept up to 5 tags
    if (tags.length < 1 && tags.length > 5) {
      return 1
    }
    return 0
  } else {
    return 1
  }
}

// this function will clear any string and only will keep words, digits, and hyphens
const clean = (string) => {
  string = string.toLowerCase()
  string = string.replace(new RegExp(' ', 'g'), '-')
  string = string.replace(/[^a-z0-9-]/g, '')
  return string.replace(/-+/g, '-')
}

// we will use this function to generate unique permlinks by using 'current date'
const createPermlink = (title) => {
  title = clean(title)
  const date = new Date()
  const sec = date.getTime() / 1000
  const now = Math.floor(sec)
  const permlink = title + '-' + now
  return permlink
}

module.exports = router