function setEventListeners() {
  let $result = $('#result-list');
  let $music = $('#music-field');

  $music.keyup(renderResultList);

  $music.on('focus', function () {
    $result.removeClass('hidden');
  });

  $('#get-playlist-btn').click(getPlaylist);

  $('#choose-again-btn').click(function () {
    $('#recommendations-list').empty();
    $('#interest-wrapper').removeClass('hidden');
    $('#recommendation-wrapper').addClass('hidden');
  });

  $('#clear-btn').click(function () {
    $('#interests-list').empty();
    $('#clear-btn').addClass("hidden");
    $('#get-playlist-btn').prop("disabled", true);
  });

  $(document).on('click', function (ev) {
    if (!$(ev.target).add($(ev.target).parents()).is('#music-field, #result-list')) {
      console.log('click');
      $result.addClass('hidden');
    }
  });

  $result.on('click', '*:not(ul):not(.disabled)', function () {
    if (this.nodeName === 'LI') {
      $('#interests-list').append($(this).off('click'));
      $result.empty();
      $result.addClass('hidden');
      $('#music-field').eq(0).val('');

      $('#get-playlist-btn').prop('disabled', false);
      $('#clear-btn').removeClass('hidden');
    }
  });

  $(window).resize(adjustWidth);
}

function renderResultList() {
  let $musicField = $('#music-field');
  const info = $musicField.eq(0).val();

  const requestTerm = info.replace(' ', '+');
  const songsRequest = $.ajax(`https://itunes.apple.com/search?term=${requestTerm}&entity=song`);
  const albumsRequest = $.ajax(`https://itunes.apple.com/search?term=${requestTerm}&entity=album`);
  const artistRequest = $.ajax(`https://itunes.apple.com/search?term=${requestTerm}&entity=musicArtist`);

  Promise.all([songsRequest, albumsRequest, artistRequest]).then(function (responses) {
    const songs = JSON.parse(responses[0]).results;
    const albums = JSON.parse(responses[1]).results;
    const artists = JSON.parse(responses[2]).results;

    let $result = $('#result-list');
    $result.empty();
    $result.append($(`<li class="list-group-item disabled">Songs</li>`));
    for (let song of songs) {
      $result.append($(`<li class="list-group-item" result-type="song" result-id="${song.trackId}" result-artist-id="${song.artistId}">
                          <img src="${song.artworkUrl60}" class="music-artwork">
                          <div class="music-info">
                             <h4>${song.trackName}</h4>
                             <span class="artist-name">${song.artistName}<span>
                          </div>
                        </li>`));
    }

    $result.append($(`<li class="list-group-item disabled">Albums</li>`));
    for (let album of albums) {
      $result.append($(`<li class="list-group-item" result-type="album" result-id="${album.collectionId}" result-artist-id="${album.artistId}">
                          <img src="${album.artworkUrl60}" class="music-artwork">
                          <div class="music-info">
                            <h4>${album.collectionName}</h4>
                            <span class="artist-name">${album.artistName}<span>
                          </div>
                        </li>`));
    }

    $result.append($(`<li class="list-group-item disabled">Artists</li>`));
    for (let artist of artists) {
      $result.append($(`<li class="list-group-item" result-type="artist" result-id="${artist.artistId}" result-artist-id="${artist.artistId}">
                          <div class="music-info">
                            <h4>${artist.artistName}</h4>
                          </div>
                        </li>`));
    }

    $result.removeClass('hidden');
  }).catch(function (reason) {
    console.log(reason);
  });
}

function getPlaylist() {
  const artistIds = Array.from($('#interests-list').children()).map(function (el) {
    return el.getAttribute('result-artist-id');
  });

  const uniqueIds = new Set(artistIds);
  const requests = [...uniqueIds].map(function (val) {
    return $.ajax(`https://itunes.apple.com/lookup?id=${val}&entity=song&limit=200`);
  });

  const playlist = [];
  Promise.all(requests).then(function (responses) {
    for (let response of responses) {
      const songs = JSON.parse(response).results;
      songs.splice(0, 1); //To remove first element (artist info object)
      playlist.push(...songs);
    }
  }).then(function () {
    $('#interest-wrapper').addClass('hidden');
    $('#recommendation-wrapper').removeClass('hidden');

    playlist.forEach((song) => {
      $('#recommendations-list').append($(`<li class="list-group-item" result-type="song" result-id="${song.trackId}" result-artist-id="${song.artistId}">
                          <img src="${song.artworkUrl60}" class="music-artwork">
                          <div class="music-info">
                             <h4>${song.trackName}</h4>
                             <span class="artist-name">${song.artistName}<span>
                          </div>
                        </li>`));
    });
  }).catch(function (reason) {
    console.log(reason);
  });
}

function adjustWidth() {
  $('#result-list').width($('#input-wrapper').width());
}

$(document).ready(function () {
  adjustWidth();
  setEventListeners();
});