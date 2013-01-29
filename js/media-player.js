/**
 *
 * deli-player - an audiojs / youtube player with soundcloud, echonest, lastfm, and bandcamp api hooks
 *
 * author: Mark Lewis
 */

var mediaPlayer = {

    /* bandcamp vars */
    bandcampApiKey: 'vatnajokull',
    bandcampDomain: 'http://api.bandcamp.com/api',
    bandcampBands: [],
    bandcampAlbums: [],
    bandcampTracks: [],
    bandcampImages: [],
    
    /* soundcloud vars */
    soundcloudClientId: 'OtYaDuMCqKGZn5IiRU2EKg',
    soundcloudDomain: 'http://api.soundcloud.com',
    soundcloudTracks: [],
    soundcloudImages: [],

    /* last.fm vars */
    lastFMDomain: 'http://ws.audioscrobbler.com/2.0',
    lastFMApiKey: 'e4d4f5353a13cf36fdb79957f831b6cf',
    lastFMApiSecret: '33de9ec1331e068d9e50e3c80f173c96',
    lastFMTopTracks: [],
    lastFMImages: [],

    /* echonest vars */
    echonestDomain: 'http://developer.echonest.com/api/v4',
    echonestApiKey: '5SMVVCCJLQPN1IIOZ',
    echonestConsumerKey: '8be1a338d938f19a8c9cde281d705095',
    echonestSecret: '58/+heZ1R3iRlFSGESrwcA',
    echonestImages: [],
    echonestTrackPreviews: [],

    /* properties */
    filterByTopSongs: false,
    filterBySongs: true,
    logSkipped: false,
    debug: true,

    topTrackTitles: {},
    youtubeVideos: [],
    youtubeFilteredVideos: [],
    allTrackTitles: [],
    allBios: [],
    allSimilar: [],
    allReviews: [],
    allEvents: [],
    allLinks: [],
    allImages: [],
    
    /* state vars */
    cache: {},
    trackListLoaded: false,
    initialized: false,

    init: function(callback) {
        this.initialized = true;
        callback();
    },

    showLoading: function() {
        return true;
    },

    hideLoading: function() {
        return true;
    },

    log: function(msg) {
        if (mediaPlayer.debug) {
            console.log(msg);
        }
    },
    
    /**
    * Youtube functions 
    *   
    */ 

    addYoutubeVideos: function(results) {
        var feed = results.feed;
        var entries = feed.entry || [];
        var html = ['<ul class="videos jcarousel jcarousel-skin-tango">'];
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var title = entry.title.$t;
            var thumbnailUrl = entries[i].media$group.media$thumbnail[0].url;
            var playerUrl = entries[i].media$group.media$content[0].url;
            var video = {
                'title' : title,
                'thumbnailUrl' : thumbnailUrl,
                'playerUrl' : playerUrl
            }

            mediaPlayer.youtubeVideos.push(video);
        }
    },

    filterYoutubeVideos: function(bandName, callback) {
        for (var v in mediaPlayer.youtubeVideos) {
            var video = mediaPlayer.youtubeVideos[v];
            var popularity = mediaPlayer.isTopTrack(bandName, video.title);

            if (popularity) {
                video.popularity = popularity; 
                mediaPlayer.youtubeFilteredVideos.push(video);
            }

        }

        callback(mediaPlayer.youtubeFilteredVideos);
    },

    loadTrackList: function(bandName, callback) {
        mediaPlayer.loadEchonestTrackList(bandName, function() {
            mediaPlayer.loadLastFMTopTracks(bandName, function() {
                mediaPlayer.log(mediaPlayer.topTrackTitles);
                mediaPlayer.trackListLoaded = true;
                callback();
            });
        });
    },

    /**
     * Echonest functions
     *
     */
    loadEchonestTrackList: function(bandName, callback) {
        var params = [];
        params['artist'] = bandName;
        params['results'] = 100;
        params['bucket'] = 'song_hotttnesss&bucket=tracks&bucket=id:7digital-US';
        params['callback'] = 'mediaPlayer.addEchonestTracks';
        mediaPlayer._sendEchonest('song/search', params, function(results) {
            //eval(results);
            callback();
        });
    },

    addEchonestTracks: function(results) {
        mediaPlayer.log('loading echonest songlist...');

        for (var s in results.response.songs) {
            var song = results.response.songs[s];
            mediaPlayer.topTrackTitles[song.title.toLowerCase()] = song.song_hotttnesss;
            mediaPlayer.allTrackTitles.push(song.title.toLowerCase());
            if (song.release_image) {
                mediaPlayer.echonestImages.push(song.release_image);
                mediaPlayer.allImages.push(song.release_image);
            }

            for (var t in song.tracks) {
                var track = song.tracks[t];
                var previewTrack = {
                                'artist': song.artist_name,
                                'poster': track.release_image,
                                'title': song.title,
                                'mp3': track.preview_url,
                                'popularity': song.song_hotttnesss
                };
                mediaPlayer.echonestTrackPreviews.push(previewTrack);
            }
        }
    },

    loadEchonestBios: function(bandName, callback) {
        var params = [];
        params['name'] = bandName;
        params['results'] = 100;
        params['callback'] = 'mediaPlayer.addEchonestBios';
        mediaPlayer._sendEchonest('artist/biographies', params, function(results) {
            //eval(results);
            callback(mediaPlayer.allBios);

        });
    },

    addEchonestBios: function(results) {
        mediaPlayer.log('loading echonest bios...');
        for (var b in results.response.biographies) {
            var bio = results.response.biographies[b];
            mediaPlayer.allBios.push(bio);
        }
    },

    loadEchonestSimilar: function(bandName, callback) {
        var params = [];
        params['name'] = bandName;
        params['results'] = 20;
        params['callback'] = 'mediaPlayer.addEchonestSimilar';
        mediaPlayer._sendEchonest('artist/similar', params, function(results) {
            //eval(results);
            callback(mediaPlayer.allSimilar);
        });
    },

    addEchonestSimilar: function(results) {
        mediaPlayer.log('loading echonest similar...');
        for (var a in results.response.artists) {
            var artist = results.response.artists[a];
            mediaPlayer.allSimilar.push(artist);
        }
    },

    loadEchonestLinks: function(bandName, callback) {
        var params = [];
        params['name'] = bandName;
        params['callback'] = 'mediaPlayer.addEchonestLinks';
        mediaPlayer._sendEchonest('artist/urls', params, function(results) {
            //eval(results);
            callback(mediaPlayer.allLinks);
        });
    },
    
    addEchonestLinks: function(results) {
        mediaPlayer.log('loading echonest links...');
        for (var l in results.response.urls) {
            var link = results.response.urls[l];
            mediaPlayer.allLinks.push(link);
        }

    },

    /**
     * Last.fm functions
     *
     */

    loadLastFMEvents: function(bandName, callback) {
        var params = [];

        mediaPlayer.log('loading lastfm events...');

        params['artist'] = bandName;
        params['callback'] = 'mediaPlayer.addLastFMEvents';

        mediaPlayer._sendLastFM('artist.getEvents', params, function(results) {
            //eval(results);
            callback(mediaPlayer.allEvents);
 
        });
    },

    addLastFMEvents: function(results) {
        mediaPlayer.log('loading lastfm events...');
        for (var e in results.events.event) {
            var event = results.events.event[e];

            mediaPlayer.allEvents.push(event);
        } 
    },

    loadLastFMTopTracks: function(bandName, callback) {
        var params = [];
        
        params['artist'] = bandName;
        params['callback'] = 'mediaPlayer.addLastFMTracks';

        mediaPlayer._sendLastFM('artist.getTopTracks', params, function(results) {
            //eval(results);
            callback();
        });
    },

    addLastFMTracks: function(results) {

        mediaPlayer.log('loading last.fm top tracks');

        // convert listens to popularity percentage
        var total_plays = 0;
        for (var t in results.toptracks.track) {
            total_plays += parseInt(results.toptracks.track[t].playcount, 10);
        }

        for (var t in results.toptracks.track) {
            var track = results.toptracks.track[t];

            mediaPlayer.lastFMTopTracks.push(track);
            mediaPlayer.topTrackTitles[track.name.toLowerCase()] = parseFloat((parseInt(track.playcount, 10) / parseInt(total_plays, 10)));
            mediaPlayer.allTrackTitles.push(track.name.toLowerCase());
            if (track.image[2]['#text']) {
                mediaPlayer.lastFMImages.push(track.image[2]['#text']);
                mediaPlayer.allImages.push(track.image[2]['#text']);
            }
        }
    },

    /**
     * Utility functions
     *
     */
    isTopTrack: function(bandName, trackTitle) {
        // remove band name from title
        var modifiedTitle = trackTitle.toLowerCase().replace(bandName.toLowerCase() + ' - ', '').trim();

        // quick match
        if (($.isEmptyObject(mediaPlayer.topTrackTitles)) ||
            (mediaPlayer.topTrackTitles[modifiedTitle]) ||
            (mediaPlayer.topTrackTitles[trackTitle.toLowerCase()])) {
            return Math.max(mediaPlayer.topTrackTitles[modifiedTitle], mediaPlayer.topTrackTitles[trackTitle.toLowerCase()]);
        }

        // closer look match
        for (var title in mediaPlayer.topTrackTitles) {
            var patternTitle = title.replace(/\(/g, '\\(').
                replace(/\)/g, '\\)').
                replace(/\[/g, '\\[').
                replace(/\*/g, '\\*').
                replace(/\]/g, '\\]');
            var pattern = new RegExp('^.*' + patternTitle + '.*$', 'i');
            if(trackTitle.match(pattern)) {
                mediaPlayer.log('added: '+trackTitle+' match on: '+title);
                return mediaPlayer.topTrackTitles[title];
            }
        }

        if (mediaPlayer.logSkipped) {
            console.log('skipped ' + trackTitle);
        }
        return false;
    },

    /**
     * Soundcloud functions
     *
     */
    loadSoundcloudTracks: function(bandName, callback) {
        //SC.get('/tracks', { q: bandName }, function(tracks) {
        var endpoint = 'tracks.json';
        var params = [];

        params['q'] = bandName;
        params['limit'] = 50;

        mediaPlayer._sendSoundcloud(endpoint, params, function(results) { 
            mediaPlayer.log('loading soundcloud tracks...');
            for (var t in results) {
                var track = results[t];
                if (track.sharing == 'public') {
                    var popularity = mediaPlayer.isTopTrack(bandName, track.title);
                    // filter by top track titles
                    if (popularity) { 
                        var playlistTrack = {
                            'artist': track.user.username,
                            'albumName': '',
                            'poster': track.artwork_url,
                            'title': track.title,
                            'mp3': track.stream_url + '?client_id='+mediaPlayer.soundcloudClientId,
                            'popularity': popularity
                        };
                        mediaPlayer.soundcloudTracks.push(playlistTrack);
                        if (track.artwork_url) {
                            mediaPlayer.soundcloudImages.push(track.artwork_url);
                            mediaPlayer.allImages.push(track.artwork_url);
                        }
                    } 
                }
            }
            callback(mediaPlayer.soundcloudTracks);
        });

    },

    /**
     * Bandcamp functions
     *
     */
    loadBandcampTracks: function(bandName, callback) {
        var bandEndpoint = "band/3/search"
        var bandParams = [];

        bandParams['name'] = encodeURIComponent(bandName);
        bandParams['name'] = bandName;
        bandParams['callback'] = 'mediaPlayer.addBandcampBandIds';

        /* get all matching bands */
        mediaPlayer._sendBandcamp(bandEndpoint, bandParams, function(band_results) {
            //eval(band_results);
            mediaPlayer.addBandcampBandIds(band_results);

            var albumEndpoint = 'band/3/discography';
            var albumParams = [];
            var bandIdsString = mediaPlayer.bandcampBands.join(',');

            albumParams['band_id'] = bandIdsString;
            albumParams['callback'] = 'mediaPlayer.addBandcampAlbumIds';
     
            /* get all albums for all matching bands */
            mediaPlayer._sendBandcamp(albumEndpoint, albumParams, function(album_results) {
                //eval(album_results);
                
                if (typeof album_results.discography == 'undefined') {
                    callback();
                    return false;
                }

                mediaPlayer.addBandcampAlbumIds(album_results);

                var total_albums = album_results.discography.length;
                var processed = 0;

                for (var a in album_results.discography) {
                    var albumInfoEndpoint = "album/2/info";
                    var albumInfoParams = [];
                    albumInfoParams['album_id'] = album_results.discography[a].album_id;
                    albumInfoParams['callback'] = 'mediaPlayer.addBandcampTracks';
                
                    /* get album info (track ids) */
                    (function(total_albums) {
                        mediaPlayer._sendBandcamp(albumInfoEndpoint, albumInfoParams, function(track_results) {
                            //eval(track_results);
                            mediaPlayer.addBandcampTracks(track_results);
                            processed++;
                            if (processed == total_albums) {
                                callback(mediaPlayer.bandcampTracks);
                            }
                        }); 
                    })(total_albums);
                }
            });
        });
    },

    addBandcampBandIds: function(results) {
        mediaPlayer.log('loading bandcamp bands...');
        for (var b in results.results) {
            var band = results.results[b];
            mediaPlayer.bandcampBands.push(band.band_id);
        }
    },

    addBandcampAlbumIds: function(results) {
        mediaPlayer.log('loading bandcamp albums...');
        for (var a in results.discography) {
            var album = results.discography[a];
            mediaPlayer.bandcampAlbums.push(album.album_id);
        }
    },

    addBandcampTracks: function(results) {
        mediaPlayer.log('loading bandcamp tracks...');
        for (var t in results.tracks) {
            var track = results.tracks[t];
            var popularity = mediaPlayer.isTopTrack('', track.title);
            var playlistTrack = {
                'artist': '',
                'albumName': results.title,
                'poster': results.large_art_url,
                'title': track.title,
                'mp3': track.streaming_url,
                'popularity': popularity
            };
            mediaPlayer.bandcampTracks.push(playlistTrack);
        }
    },

    /**
     * Send functions
     *
     */
    _sendBandcamp: function(endpoint, params, callback) {
        var url = mediaPlayer.bandcampDomain + '/' + endpoint; 
        
        params['key'] = mediaPlayer.bandcampApiKey;

        mediaPlayer._send(url, params, 'jsonp', callback);
    },
    
    _sendSoundcloud: function(endpoint, params, callback) {
        var url = mediaPlayer.soundcloudDomain + '/' + endpoint;

        params['client_id'] = mediaPlayer.soundcloudClientId;

        mediaPlayer._send(url, params, '', callback);
    },

    _sendLastFM: function(endpoint, params, callback) {
        var url = mediaPlayer.lastFMDomain + '/';

        params['method'] = endpoint;
        params['api_key'] = mediaPlayer.lastFMApiKey;
        params['format'] = 'json';

        mediaPlayer._send(url, params, '', callback);
    },

    _sendEchonest: function(endpoint, params, callback) {
        var url = mediaPlayer.echonestDomain + '/' + endpoint;

        params['api_key'] = mediaPlayer.echonestApiKey;
        params['format'] = 'jsonp';

        mediaPlayer._send(url, params, '', callback);
    },

    _send: function(url, params, dataType, callback) {
        var first = true;
    
        // show loading page
        mediaPlayer.showLoading();

        for (param in params) {
            url += (first) ? '?' : '&';
            first=false;
            url += param + "=" + params[param]
        }

        mediaPlayer.log(url);

        if (this.cache[url]) {
            mediaPlayer.log(url + ' loaded from cache');
            mediaPlayer.hideLoading();
            callback(this.cache[url]);
        } else {
            $.ajax({
                url: url,
                type: 'get',
                dataType: dataType,
                success: function(response) {
                    mediaPlayer.cache[url] = response
                    mediaPlayer.hideLoading();
                    callback(response);
                },
                error: function(errorObj, textStatus, errorMsg) {
                    console.log(url + ' -- ' + JSON.stringify(errorMsg));
                    callback();
                }
            });
        }
    },

};

/* event listeners */
