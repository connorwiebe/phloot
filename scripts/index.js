const $ = require('jquery')
const storage = require('../helpers/storage')

// make
const make = artist => `
  <div class='item'>
    <div class='item-artist'>${artist}</div>
    <span class='clear'></span>
  </div>`

const r = song => `
  <div class='song'>
    <div class='thumbnail'>
      <div class='play'></div>
    </div>
    <div class='metadata'>
      <p class='name'>${song.name}</p>
      <p class='artist'>${song.artist}</p>
    </div>
  </div>`

const video = id => `<iframe class="video" src="https://www.youtube.com/embed/${id}?autoplay=1" frameborder="0" allowfullscreen></iframe>`

// list
if (storage.get('list') === null) storage.set('list', [{artist:''}])
const list = storage.get('list')
list.forEach(item => {
  if (item.artist) $('.list').append(make(item.artist))
  setTimeout(() => {
    $('.wrapper').addClass('visible')
  },25)
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
  const list = storage.get('list')
  if (list.length > 1) {
    $('.song,.video').fadeOut(() => $('.song,.video').remove())
    $('.flute').fadeIn()
    const song = await fetch('/song', {
      headers: new Headers({ 'content-type': 'application/json' }),
      method: 'post',
      body: JSON.stringify({ list })
    }).then(res => res.json())
    $('.recommendation').append(video(song.id),r(song))
    $('.flute').fadeOut(() => {
      $('.song,.video').fadeIn()
    })
  }
})
