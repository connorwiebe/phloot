const $ = require('jquery')
const storage = require('../helpers/storage')
const loaded = require('image-loaded')

// make
const make = artist => `
  <div class='item'>
    <div class='item-artist'>${artist}</div>
    <i class='material-icons clear'>clear</i>
  </div>`

const recommendation = song => `
  <div class='song'>
    <div class='thumbnail'>
      <img src='${song.image}'>
    </div>
    <div class='metadata'>
      <p class='name'>${song.name}</p>
      <p class='artist'>${song.artist}</p>
    </div>
  </div>`

// list
if (storage.get('list') === null) storage.set('list', [{artist:''}])
const list = storage.get('list')
list.forEach(item => {
  if (item.artist) $('.list').append(make(item.artist))
})

// search
$('form').on('submit', async e => {
  e.preventDefault()
  const artist = $('input[type="text"]').val()
  if (!artist) return
  let list = storage.get('list')
  list.push({ artist })
  storage.set('list', list)
  $('input[type="text"]').val('')
  $('.list').append(make(artist))
})

// remove
$('body').on('click', '.clear', async e => {
  const target = $(e.target)
  const item = target.parent()
  const artist = target.siblings('.item-artist').text()
  let list = storage.get('list')
  list = list.filter(item => item.artist !== artist)
  storage.set('list', list)
  item.remove()
})

// get
$('.get').on('click', async e => {
  const song = $('.song')
  song.fadeOut(() => song.remove())
  $('.flute').fadeIn()
  const list = storage.get('list')
  const songs = await fetch('/song', {
    headers: new Headers({ 'content-type': 'application/json' }),
    method: 'post',
    body: JSON.stringify({ list })
  }).then(res => res.json())
  songs.forEach(song => {
    $('.recommendation').append(recommendation(song))
    loaded($('.thumbnail img')[0], (err, alreadyLoaded) => {
      $('.flute').fadeOut(() => {
        $('.song').fadeIn()
      })
    })
  })
})
