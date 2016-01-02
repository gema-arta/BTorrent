// Generated by CoffeeScript 1.10.0
(function() {
  var app, client, dbg, debug, er, opts, rtcConfig, trackers;

  trackers = [['wss://tracker.btorrent.xyz'], ['wss://tracker.webtorrent.io']];

  opts = {
    announce: trackers
  };

  rtcConfig = {
    "iceServers": [
      {
        "url": "stun:23.21.150.121",
        "urls": "stun:23.21.150.121"
      }, {
        "url": "stun:stun.l.google.com:19302",
        "urls": "stun:stun.l.google.com:19302"
      }, {
        "url": "turn:global.turn.twilio.com:3478?transport=udp",
        "urls": "turn:global.turn.twilio.com:3478?transport=udp",
        "username": "857315a4616be37252127d4ff924c3a3536dd3fa729b56206dfa0e6808a80478",
        "credential": "EEEr7bxx8umMHC4sOoWDC/4MxU/4JCfL+W7KeSJEsBQ="
      }, {
        "url": "turn:numb.viagenie.ca",
        "urls": "turn:numb.viagenie.ca",
        "credential": "webrtcdemo",
        "username": "louis%40mozilla.com"
      }
    ]
  };

  debug = window.localStorage.getItem('debug') != null;

  dbg = function(string, item, color) {
    color = color != null ? color : '#333333';
    if (debug) {
      if ((item != null) && item.name) {
        return console.debug('%cβTorrent:' + (item.infoHash != null ? 'torrent ' : 'torrent ' + item._torrent.name + ':file ') + item.name + (item.infoHash != null ? ' (' + item.infoHash + ')' : '') + ' %c' + string, 'color: #33C3F0', 'color: ' + color);
      } else {
        return console.debug('%cβTorrent:client %c' + string, 'color: #33C3F0', 'color: ' + color);
      }
    }
  };

  er = function(err, item) {
    return dbg(err, item, '#FF0000');
  };

  client = new WebTorrent({
    rtcConfig: rtcConfig
  });

  app = angular.module('BTorrent', ['ui.grid', 'ui.grid.resizeColumns', 'ui.grid.selection', 'ngFileUpload', 'ngNotify'], [
    '$compileProvider', '$locationProvider', function($compileProvider, $locationProvider) {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|magnet|blob|javascript):/);
      return $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      }).hashPrefix('#');
    }
  ]);

  app.controller('BTorrentCtrl', [
    '$scope', '$http', '$log', '$location', 'ngNotify', function($scope, $http, $log, $location, ngNotify) {
      var rtc, updateAll;
      rtc = window.mozRTCPeerConnection || window.RTCPeerConnection || window.webkitRTCPeerConnection;
      if (rtc == null) {
        $scope.disabled = true;
        ngNotify.set('Please use latest Chrome, Firefox or Opera', {
          type: 'error',
          sticky: true
        });
      }
      rtc = null;
      $scope.client = client;
      $scope.seedIt = true;
      $scope.columns = [
        {
          field: 'name',
          cellTooltip: true,
          minWidth: '200'
        }, {
          field: 'length',
          name: 'Size',
          cellFilter: 'pbytes',
          width: '80'
        }, {
          field: 'received',
          displayName: 'Downloaded',
          cellFilter: 'pbytes',
          width: '135'
        }, {
          field: 'downloadSpeed()',
          displayName: '↓ Speed',
          cellFilter: 'pbytes:1',
          width: '100'
        }, {
          field: 'progress',
          displayName: 'Progress',
          cellFilter: 'progress',
          width: '100'
        }, {
          field: 'timeRemaining',
          displayName: 'ETA',
          cellFilter: 'humanTime',
          width: '140'
        }, {
          field: 'uploaded',
          displayName: 'Uploaded',
          cellFilter: 'pbytes',
          width: '125'
        }, {
          field: 'uploadSpeed()',
          displayName: '↑ Speed',
          cellFilter: 'pbytes:1',
          width: '100'
        }, {
          field: 'numPeers',
          displayName: 'Peers',
          width: '80'
        }, {
          field: 'ratio',
          cellFilter: 'number:2',
          width: '80'
        }
      ];
      $scope.gridOptions = {
        columnDefs: $scope.columns,
        data: $scope.client.torrents,
        enableColumnResizing: true,
        enableColumnMenus: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false
      };
      updateAll = function() {
        if ($scope.client.processing) {
          return;
        }
        return $scope.$apply();
      };
      setInterval(updateAll, 500);
      $scope.gridOptions.onRegisterApi = function(gridApi) {
        $scope.gridApi = gridApi;
        return gridApi.selection.on.rowSelectionChanged($scope, function(row) {
          if (!row.isSelected && ($scope.selectedTorrent != null) && ($scope.selectedTorrent.infoHash = row.entity.infoHash)) {
            return $scope.selectedTorrent = null;
          } else {
            return $scope.selectedTorrent = row.entity;
          }
        });
      };
      $scope.seedFiles = function(files) {
        var name;
        if (files != null) {
          if (files.length === 1) {
            dbg('Seeding file ' + files[0].name);
          } else {
            dbg('Seeding ' + files.length + ' files');
            name = prompt('Please name your torrent', 'My Awesome Torrent') || 'My Awesome Torrent';
            opts.name = name;
          }
          $scope.client.processing = true;
          $scope.client.seed(files, opts, $scope.onSeed);
          return delete opts.name;
        }
      };
      $scope.openTorrentFile = function(file) {
        if (file != null) {
          dbg('Adding torrent file ' + file.name);
          $scope.client.processing = true;
          return $scope.client.add(file, opts, $scope.onTorrent);
        }
      };
      $scope.client.on('error', function(err, torrent) {
        $scope.client.processing = false;
        ngNotify.set(err, 'error');
        return er(err, torrent);
      });
      $scope.addMagnet = function() {
        if ($scope.torrentInput !== '') {
          dbg('Adding magnet/hash ' + $scope.torrentInput);
          $scope.client.processing = true;
          $scope.client.add($scope.torrentInput, opts, $scope.onTorrent);
          return $scope.torrentInput = '';
        }
      };
      $scope.destroyedTorrent = function(err) {
        if (err) {
          throw err;
        }
        dbg('Destroyed torrent', $scope.selectedTorrent);
        $scope.selectedTorrent = null;
        return $scope.client.processing = false;
      };
      $scope.changePriority = function(file) {
        if (file.priority === '-1') {
          dbg('Deselected', file);
          return file.deselect();
        } else {
          dbg('Selected ', file);
          return file.select();
        }
      };
      $scope.onTorrent = function(torrent, isSeed) {
        torrent.safeTorrentFileURL = torrent.torrentFileURL;
        torrent.fileName = torrent.name + '.torrent';
        if (!isSeed) {
          if (!($scope.selectedTorrent != null)) {
            $scope.selectedTorrent = torrent;
          }
          $scope.client.processing = false;
        }
        torrent.files.forEach(function(file) {
          file.getBlobURL(function(err, url) {
            if (err) {
              throw err;
            }
            if (isSeed) {
              dbg('Started seeding', torrent);
              if (!($scope.selectedTorrent != null)) {
                $scope.selectedTorrent = torrent;
              }
              $scope.client.processing = false;
            }
            file.url = url;
            if (!isSeed) {
              return dbg('Done ', file);
            }
          });
          if (!isSeed) {
            return dbg('Received metadata', file);
          }
        });
        torrent.on('download', function(chunkSize) {
          if (!isSeed) {
            return dbg('Downloaded chunk', torrent);
          }
        });
        torrent.on('upload', function(chunkSize) {
          return dbg('Uploaded chunk', torrent);
        });
        torrent.on('done', function() {
          if (!isSeed) {
            dbg('Done', torrent);
          }
          return torrent.update();
        });
        torrent.on('wire', function(wire, addr) {
          return dbg('Wire ' + addr, torrent);
        });
        return torrent.on('error', function(err) {
          return er(err);
        });
      };
      $scope.onSeed = function(torrent) {
        return $scope.onTorrent(torrent, true);
      };
      if ($location.hash() !== '') {
        $scope.client.processing = true;
        setTimeout(function() {
          dbg('Adding ' + $location.hash());
          return $scope.client.add($location.hash(), $scope.onTorrent);
        }, 0);
      }
      return dbg('Ready');
    }
  ]);

  app.filter('html', [
    '$sce', function($sce) {
      return function(input) {
        $sce.trustAsHtml(input);
      };
    }
  ]);

  app.filter('pbytes', function() {
    return function(num, speed) {
      var exponent, unit, units;
      if (isNaN(num)) {
        return '';
      }
      units = ['B', 'kB', 'MB', 'GB', 'TB'];
      if (num < 1) {
        return (speed ? '' : '0 B');
      }
      exponent = Math.min(Math.floor(Math.log(num) / 6.907755278982137), 8);
      num = (num / Math.pow(1000, exponent)).toFixed(1) * 1;
      unit = units[exponent];
      return num + ' ' + unit + (speed ? '/s' : '');
    };
  });

  app.filter('humanTime', function() {
    return function(millis) {
      var remaining;
      if (millis < 1000) {
        return '';
      }
      remaining = moment.duration(millis).humanize();
      return remaining[0].toUpperCase() + remaining.substr(1);
    };
  });

  app.filter('progress', function() {
    return function(num) {
      return (100 * num).toFixed(1) + '%';
    };
  });

}).call(this);
