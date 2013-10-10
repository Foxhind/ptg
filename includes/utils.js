var getUnixTime = function() {
  return Math.round(new Date().getTime() / 1000);
};

function clone(obj) {
  var c = (typeof obj.pop === 'function') ? [] : {};
  var p, v;
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      v = obj[p];
      if(v && typeof v === 'object') {
        c[p] = clone(v);
      } else {
        c[p] = v;
      }
    }
  }
  return c;
}

var Notifier = function() {
  this.listeners = {};

  function onMessage(message, sender, callback) {
    if (message.name) {
      this.notifyLocal(message.name, message.data, sender, callback);
    }
    return !!callback;
  }

  chrome.extension.onMessage.addListener(onMessage.bind(this));

  Notifier.prototype.notifyLocal = function(name, data, sender, callback) {
    if (name in this.listeners) {
      var listeners = this.listeners[name];
      for (var i = 0; i < listeners.length; i++) {
        var listener = listeners[i];
        listener(data, sender, callback);
      }
    }
  };

  Notifier.prototype.notify = function(name, data, callback) {
    if (callback) {
      chrome.extension.sendMessage({name: name, data: data}, callback);
    } else {
      chrome.extension.sendMessage({name: name, data: data});
    }
  };

  Notifier.prototype.addListener = function(name, listener) {
    if (!(name in this.listeners)) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(listener);
  };
};

var Storage = function() {
  Storage.prototype.set = function(key, value) {
    localStorage[key] = JSON.stringify(value);
  },
  Storage.prototype.get = function(key, callback) {
    var value = localStorage[key];
    if (value === undefined) {
      callback(true, null);
      return;
    }
    try {
      value = JSON.parse(value);
    } catch(e) {
      callback(true, null);
      return;
    }
    callback(null, value);
  }
};

var Blacklist = function(storage) {
  this.storage = storage;
  this.list = {};
  this.localList = {};
  this.url = 'http://poi.nanodesu.ru';

  var interval = 900,
      errorInterval = 60;

  Blacklist.prototype.load = function(callback) {
    var that = this;
    that.storage.get('blacklist.local', function(err, list) {
      if (list) {
        that.localList = list;
      }
    });

    async.parallel([
      function(callback) {
        that.storage.get('blacklist.timestamp', callback);
      },
      function(callback) {
        that.storage.get('blacklist', callback);
      }
    ],
    function(err, results) {
      if (err || results[0] < (getUnixTime() - interval)) {
        that.get();
      } else {
        that.list = results[1];
        setTimeout(function() {
          that.get();
        }, (results[0] + interval - getUnixTime()) * 1000);
      }
    });
  };

  Blacklist.prototype.get = function() {
    var that = this;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        if(request.status == 200) {
          var response;
          try {
            response = JSON.parse(request.responseText);
          } catch(e) {
            if (that.onError) {
              that.onError('Ошибка в ответе POI Crawler API.');
            }
            return;
          }
          that.list = response;
          that.save();
          setTimeout(function() {
            that.get();
          }, interval * 1000);
        } else {
          if (that.onError) {
            that.onError('Ошибка HTTP' + (request.status ? ' ' + request.status : '') + '.');
          }
          setTimeout(function() {
            that.get();
          }, errorInterval * 1000);
        }
      }
    };
    request.open('GET', this.url + '/blacklist.json');
    request.send();
  };

  Blacklist.prototype.save = function() {
    this.storage.set('blacklist', this.list);
    this.storage.set('blacklist.timestamp', getUnixTime());
    this.storage.set('blacklist.local', this.localList);
  };

  Blacklist.prototype.test = function(host) {
    return !!(this.list[host] || this.localList[host]);
  };

  Blacklist.prototype.add = function(host) {
    this.localList[host] = true;

    var request = new XMLHttpRequest();
    request.open('GET', this.url + '/add.php?host=' + encodeURIComponent(host));
    request.send();
  };

  this.load();
};
