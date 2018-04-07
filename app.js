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
const Bottleneck = require('bottleneck')
const limiter = new Bottleneck({ minTime: 1000, highWater: 666 })
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
  const r = await getRecommendations(1, list)
  res.json(r)
})

const normalizeSong = async song => {
  let data
  data = {
    name: song.name,
    artist: song.artist.name
  }
  let image = await rp({
    uri: `https://itunes.apple.com/search?term=${encodeURIComponent(`${data.artist} ${data.name}`)}&limit=1&sort=popular&entity=song`,
    json: true
  })
  if (image.results.length) {
    data.image = image.results[0].artworkUrl100.replace('100x100', '200x200')
  }  else if (song.image[song.image.length-1]['#text']) {
    data.image = song.image[song.image.length-1]['#text']
  } else {
    data.image = 'images/placeholder.png'
  }
  return data
}

const randomItem = array => Math.floor(Math.random() * array.length)

async function getRecommendations (numResults, list) {
  const randomSongs = []
  for (let i = 0; i < numResults; i++) {
    const randomSong = list[randomItem(list)]
    randomSongs.push(randomSong)
  }
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
  return await Promise.map(randomSongs, item => {
    return limiter.schedule(item => getTrack(item), item)
  })
}
