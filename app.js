if (process.env.NODE_ENV === 'development') require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const url = require('url')
const favicon = require('serve-favicon')
const rp = require('request-promise')
const Promise = require('bluebird')
const pug = require('pug')
const compression = require('compression')
const bodyParser = require('body-parser')
app.listen(process.env.PORT || 6655)
const dev = process.env.NODE_ENV === 'development' ? true : false
if (!dev) app.use(compression({threshold:0}))
app.locals.min = !dev ? '.min' : ''
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public'), { maxAge: !dev ? 2628002880 : 0 }))
app.use(favicon(path.join(__dirname, 'public/images/flute.png')))

// get index
app.get('/', (req, res, next) => res.render('index'))

// get song
app.post('/song', async (req, res, next) => {
  const list = req.body.list.filter(item => item.artist !== '')
  const r = await getRecommendation(list)
  const result = await rp({
    uri: `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=relevance&q=${encodeURIComponent(`${r.artist} ${r.name}`)}&type=video&key=${process.env.YOUTUBE_API_KEY}`,
    json: true
  })
  r.id = result.items[0].id.videoId
  res.json(r)
})

// get recommendation
const normalizeSong = async song => {
  return { name: song.name, artist: song.artist.name }
}

const randomItem = array => Math.floor(Math.random() * array.length)

async function getRecommendation (list) {
  const song = list[randomItem(list)]
  const getTrack = async item => {
    let artists = await rp({
      uri: `http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(item.artist)}&api_key=${process.env.LASTFM_API_KEY}&autocorrect=1&limit=25&format=json`,
      json: true
    })
    artists = artists.similarartists.artist
    const randomArtist = artists[randomItem(artists)]
    let tracks = await rp({
      uri: `http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(randomArtist.name)}&api_key=${process.env.LASTFM_API_KEY}&autocorrect=1&limit=25&format=json`,
      json: true
    })
    tracks = tracks.toptracks.track
    const randomTrack = tracks[randomItem(tracks)]
    return await normalizeSong(randomTrack)
  }
  return await getTrack(song)
}

// TODO: add rate limiting
