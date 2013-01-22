/**
 *
 * deli-player - an audiojs / youtube player with soundcloud, echonest, lastfm, and bandcamp api hooks
 *
 * author: Mark Lewis
 */

var deliPlayer = {

    /* bandcamp vars */
    bandcampApiKey: 'vatnajokull',
    bandcampDomain: 'http://api.bandcamp.com/api',
    bandcampBands: [],
    bandcampAlbums: [],
    bandcampTracks: [],
    
    /* soundcloud vars */
    soundcloudClientId: 'OtYaDuMCqKGZn5IiRU2EKg',
    soundcloudTracks: [],

    /* last.fm vars */
    lastFMDomain: 'http://ws.audioscrobbler.com/2.0',
    lastFMApiKey: 'e4d4f5353a13cf36fdb79957f831b6cf',
    lastFMApiSecret: '33de9ec1331e068d9e50e3c80f173c96',
    lastFMTopTracks: [],

    /* echonest vars */
    echonestDomain: 'http://developer.echonest.com/api/v4',
    echonestApiKey: '5SMVVCCJLQPN1IIOZ',
    echonestConsumerKey: '8be1a338d938f19a8c9cde281d705095',
    echonestSecret: '58/+heZ1R3iRlFSGESrwcA',

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
    

    proxyUrl: '/proxy.php',

    /* state vars */
    cache: {},
    trackListLoaded: false,
    initialized: false,

    init: function(callback) {
        this.initialized = true;
        SC.initialize({
            client_id: deliPlayer.soundcloudClientId
        });
        callback();
    },

    showLoading: function() {
        return true;
    },

    hideLoading: function() {
        return true;
    },

    log: function(msg) {
        if (deliPlayer.debug) {
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

            deliPlayer.youtubeVideos.push(video);
        }
    },

    filterYoutubeVideos: function(bandName, callback) {
        for (var v in deliPlayer.youtubeVideos) {
            var video = deliPlayer.youtubeVideos[v];

            if (deliPlayer.isTopTrack(bandName, video.title)) {
                deliPlayer.youtubeFilteredVideos.push(video);
            }

        }

        callback(deliPlayer.youtubeFilteredVideos);
    },

    loadTrackList: function(bandName, callback) {
        deliPlayer.loadEchonestTrackList(bandName, function() {
            deliPlayer.loadLastFMTopTracks(bandName, function() {
                deliPlayer.log(deliPlayer.topTrackTitles);
                deliPlayer.trackListLoaded = true;
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
        params['callback'] = 'deliPlayer.addEchonestTracks';
        deliPlayer._sendEchonest('song/search', params, function(results) {
            eval(results);
            callback();
        });
    },

    addEchonestTracks: function(results) {
        deliPlayer.log('loading echonest songlist...');

        for (var s in results.response.songs) {
            var song = results.response.songs[s];
            deliPlayer.topTrackTitles[song.title.toLowerCase()] = 1;
            deliPlayer.allTrackTitles.push(song.title.toLowerCase());
        }
    },

    loadEchonestBios: function(bandName, callback) {
        var params = [];
        params['name'] = bandName;
        params['results'] = 100;
        params['callback'] = 'deliPlayer.addEchonestBios';
        deliPlayer._sendEchonest('artist/biographies', params, function(results) {
            eval(results);
            callback(deliPlayer.allBios);

        });
    },

    addEchonestBios: function(results) {
        deliPlayer.log('loading echonest bios...');
        for (var b in results.response.biographies) {
            var bio = results.response.biographies[b];
            deliPlayer.allBios.push(bio);
        }
    },

    loadEchonestSimilar: function(bandName, callback) {
        var params = [];
        params['name'] = bandName;
        params['results'] = 20;
        params['callback'] = 'deliPlayer.addEchonestSimilar';
        deliPlayer._sendEchonest('artist/similar', params, function(results) {
            eval(results);
            callback(deliPlayer.allSimilar);
        });
    },

    addEchonestSimilar: function(results) {
        deliPlayer.log('loading echonest similar...');
        for (var a in results.response.artists) {
            var artist = results.response.artists[a];
            deliPlayer.allSimilar.push(artist);
        }
    },

    loadEchonestLinks: function(bandName, callback) {
        var params = [];
        params['name'] = bandName;
        params['callback'] = 'deliPlayer.addEchonestLinks';
        deliPlayer._sendEchonest('artist/urls', params, function(results) {
            eval(results);
            callback(deliPlayer.allLinks);
        });
    },
    
    addEchonestLinks: function(results) {
        deliPlayer.log('loading echonest links...');
        for (var l in results.response.urls) {
            var link = results.response.urls[l];
            deliPlayer.allLinks.push(link);
        }

    },

    /**
     * Last.fm functions
     *
     */

    loadLastFMEvents: function(bandName, callback) {
        var params = [];

        deliPlayer.log('loading lastfm events...');

        params['artist'] = bandName;
        params['callback'] = 'deliPlayer.addLastFMEvents';

        deliPlayer._sendLastFM('artist.getEvents', params, function(results) {
            eval(results);
            callback(deliPlayer.allEvents);
 
        });
    },

    addLastFMEvents: function(results) {
        deliPlayer.log('loading lastfm events...');
        for (var e in results.events.event) {
            var event = results.events.event[e];

            deliPlayer.allEvents.push(event);
        } 
    },

    loadLastFMTopTracks: function(bandName, callback) {
        var params = [];
        
        params['artist'] = bandName;
        params['callback'] = 'deliPlayer.addLastFMTracks';

        deliPlayer._sendLastFM('artist.getTopTracks', params, function(results) {
            eval(results);
            callback();
        });
    },

    addLastFMTracks: function(results) {

        deliPlayer.log('loading last.fm top tracks');
        for (var t in results.toptracks.track) {
            var track = results.toptracks.track[t];

            deliPlayer.lastFMTopTracks.push(track);
            deliPlayer.topTrackTitles[track.name.toLowerCase()] = track.playcount;
            deliPlayer.allTrackTitles.push(track.name.toLowerCase());
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
        if (($.isEmptyObject(deliPlayer.topTrackTitles)) ||
            (deliPlayer.topTrackTitles[modifiedTitle]) ||
            (deliPlayer.topTrackTitles[trackTitle.toLowerCase()])) {
            return true;
        }

        // closer look match
        for (var title in deliPlayer.topTrackTitles) {
            var patternTitle = title.replace(/\(/g, '\\(').
                replace(/\)/g, '\\)').
                replace(/\[/g, '\\[').
                replace(/\]/g, '\\]');
            var pattern = new RegExp('^.*' + patternTitle + '.*$', 'i');
            if(trackTitle.match(pattern)) {
                deliPlayer.log('added: '+trackTitle+' match on: '+title);
                return true;
            }
        }

        if (deliPlayer.logSkipped) {
            console.log('skipped ' + trackTitle);
        }
        return false;
    },

    /**
     * Soundcloud functions
     *
     */
    loadSoundcloudTracks: function(bandName, callback) {
        SC.get('/tracks', { q: bandName }, function(tracks) {
            for (var t in tracks) {
                var track = tracks[t];
                if (track.sharing == 'public') {
                    // filter by top track titles
                    if (deliPlayer.isTopTrack(bandName, track.title)) { 
                        var playlistTrack = {
                            'artist': track.user.username,
                            'albumName': '',
                            'poster': track.artwork_url,
                            'albumAbout': track.description,
                            'title': track.title,
                            'trackAbout': track.description,
                            'mp3': track.stream_url + '?client_id='+deliPlayer.soundcloudClientId,
                            'trackDuration': track.duration
                        };
                        deliPlayer.soundcloudTracks.push(playlistTrack);
                    } 
                }
            }
            callback(deliPlayer.soundcloudTracks);
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
        bandParams['callback'] = 'deliPlayer.addBandcampBandIds';

        /* get all matching bands */
        deliPlayer._sendBandcamp(bandEndpoint, bandParams, function(band_results) {
            //eval(band_results);
            deliPlayer.addBandcampBandIds(band_results);

            var albumEndpoint = 'band/3/discography';
            var albumParams = [];
            var bandIdsString = deliPlayer.bandcampBands.join(',');

            albumParams['band_id'] = bandIdsString;
            albumParams['callback'] = 'deliPlayer.addBandcampAlbumIds';
     
            /* get all albums for all matching bands */
            deliPlayer._sendBandcamp(albumEndpoint, albumParams, function(album_results) {
                //eval(album_results);
                deliPlayer.addBandcampAlbumIds(album_results);

                var albumInfoEndpoint = "album/2/info";
                var albumInfoParams = [];
                var albumIdsString = deliPlayer.bandcampAlbums.join(',');
                albumInfoParams['album_id'] = albumIdsString;
                albumInfoParams['callback'] = 'deliPlayer.addBandcampTracks';

                /* get album info (track ids) */
                deliPlayer._sendBandcamp(albumInfoEndpoint, albumInfoParams, function(track_results) {
                    //eval(track_results);
                    deliPlayer.addBandcampTracks(track_results);
                    callback(deliPlayer.bandcampTracks);
                }); 
            });
        });
    },

    addBandcampBandIds: function(results) {
        deliPlayer.log('loading bandcamp bands...');
        for (var b in results.results) {
            var band = results.results[b];
            deliPlayer.bandcampBands.push(band.band_id);
        }
    },

    addBandcampAlbumIds: function(results) {
        deliPlayer.log('loading bandcamp albums...');
        for (var a in results.discography) {
            var album = results.discography[a];
            deliPlayer.bandcampAlbums.push(album.album_id);
        }
    },

    addBandcampTracks: function(results) {
        deliPlayer.log('loading bandcamp tracks...');
        for (var t in results.tracks) {
            var track = results.tracks[t];
            var playlistTrack = {
                'artist': '',
                'albumName': results.title,
                'poster': results.large_art_url,
                'albumAbout': results.about,
                'title': track.title,
                'trackAbout': track.about,
                'mp3': track.streaming_url,
                'trackDuration': track.duration
            };
            deliPlayer.bandcampTracks.push(playlistTrack);
        }
    },

    /**
     * Send functions
     *
     */
    _sendBandcamp: function(endpoint, params, callback) {
        var url = deliPlayer.bandcampDomain + '/' + endpoint 
        
        params['key'] = deliPlayer.bandcampApiKey;

        deliPlayer._send(url, params, 'jsonp', callback);
    },

    _sendLastFM: function(endpoint, params, callback) {
        var url = deliPlayer.lastFMDomain + '/';

        params['method'] = endpoint;
        params['api_key'] = deliPlayer.lastFMApiKey;
        params['format'] = 'json';

        deliPlayer._send(url, params, '', callback);
    },

    _sendEchonest: function(endpoint, params, callback) {
        var url = deliPlayer.echonestDomain + '/' + endpoint;

        params['api_key'] = deliPlayer.echonestApiKey;
        params['format'] = 'jsonp';

        deliPlayer._send(url, params, '', callback);
    },

    _send: function(url, params, dataType, callback) {
        var first = true;
    
        // show loading page
        deliPlayer.showLoading();

        for (param in params) {
            url += (first) ? '?' : '&';
            first=false;
            url += param + "=" + params[param]
        }

        deliPlayer.log(url);

        if (this.cache[url]) {
            deliPlayer.log(url + ' loaded from cache');
            deliPlayer.hideLoading();
            callback(this.cache[url]);
        } else {
            $.ajax({
                url: url,
                type: 'get',
                dataType: dataType,
                success: function(response) {
                    deliPlayer.cache[url] = response
                    deliPlayer.hideLoading();
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
