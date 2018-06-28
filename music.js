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
      $result.addClass('hidden');
    }
  });

  $result.on('click', '*:not(ul):not(.disabled)', function () {
    if (this.nodeName === 'LI') {
      $('#interests-list').append($(this));
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
      const $li = $(`<li class="list-group-item">
                          <img src="${song.artworkUrl60}" class="music-artwork">
                          <div class="music-info">
                             <h4>${song.trackName}</h4>
                             <span class="artist-name">${song.artistName}</span>
                          </div>
                        </li>`);
      $li.data('result-type', 'song').data('result-id', song.trackId).data('result-artist-id', song.artistId);
      $result.append($li);
    }

    $result.append($(`<li class="list-group-item disabled">Albums</li>`));
    for (let album of albums) {
      const $li = $(`<li class="list-group-item">
                          <img src="${album.artworkUrl60}" class="music-artwork">
                          <div class="music-info">
                            <h4>${album.collectionName}</h4>
                            <span class="artist-name">${album.artistName}</span>
                          </div>
                        </li>`);
      $li.data('result-type', 'album').data('result-id', album.collectionId).data('result-artist-id', album.artistId);
      $result.append($li);
    }

    $result.append($(`<li class="list-group-item disabled">Artists</li>`));
    for (let artist of artists) {
      const $li =$(`<li class="list-group-item">
                          <div class="music-info">
                            <h4>${artist.artistName}</h4>
                          </div>
                        </li>`);
      $li.data('result-type', 'artist').data('result-id', artist.artistId).data('result-artist-id', artist.artistId);
      $result.append($li);
    }

    $result.removeClass('hidden');
  }).catch(function (reason) {
    console.log(reason);
  });
}

function getPlaylist() {
  const artistIds = Array.from($('#interests-list').children()).map((el) => $(el).data('result-artist-id'));

  const uniqueIds = new Set(artistIds);
  const requests = [...uniqueIds].map((val) => $.ajax(`https://itunes.apple.com/lookup?id=${val}&entity=song&limit=200`));

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
      $('#recommendations-list').append($(`<li class="list-group-item">
                          <img src="${song.artworkUrl60}" class="music-artwork">
                          <div class="music-info">
                             <h4>${song.trackName}</h4>
                             <span class="artist-name">${song.artistName}</span>
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