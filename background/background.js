function expandStreet(street) {
  var replaces = [
    [/(^|\s)(улица|ул\.?)($|\s)/, '$1(улица|ул)$3'],
    [/(^|\s)(переулок|пер\.?)($|\s)/, '$1(переулок|пер)$3'],
    [/(^|\s)(проспект|просп\.?|пр-т)($|\s)/, '$1(проспект|пр-т|пр)$3'],
    [/(^|\s)(проезд|пр-д)($|\s)/, '$1(проезд|пр-д|пр)$3'],
    [/(^|\s)(набережная|наб\.?)($|\s)/, '$1(набережная|наб)$3'],
    [/(^|\s)(шоссе|ш\.?)($|\s)/, '$1(шоссе|ш)$3']
  ];
  for (var i = 0; i < replaces.length; i++) {
    street = street.replace(replaces[i][0], replaces[i][1]);
  }
  street = street.replace(/(^|\s)([а-яА-ЯёЁ\l])/g, '$1+$2');
  return street;
}

// Переделать на сборку из обнаруженных элементов
function expandHousenumber(street) {
  var replaces = [
    [/^\s*([\d\/]+)(?:([а-яА-Я\l])(?:\s|$))?/, ' & +"$1$2"'],
    [/\s*(?:строение|стр\.?|с\.?)\s*([\d\/]+)(?:([а-яА-Я\l])(?:\s|$))?/, ' & (строение|стр|с) +"$1$2"'],
    [/\s*(?:корпус|корп\.?|кор\.?|к\.?)\s*([\d\/]+)(?:([а-яА-Я\l])(?:\s|$))?/, ' & (корпус|корп|кор|к) +"$1$2"'],
    [/\s*(?:владение|влад\.?|вл\.?|в\.?)\s*([\d\/]+)(?:([а-яА-Я\l])(?:\s|$))?/, ' & (владение|влад|вл) +"$1$2"'],
    [/\s*(?:литера|лит\.?|л\.?)\s*([\d\/]+)(?:([а-яА-Я\l])(?:\s|$))?/, ' & (литера|лит) +"$1$2"']
  ];
  for (var i = 0; i < replaces.length; i++) {
    street = street.replace(replaces[i][0], replaces[i][1]);
  }
  return street;
}

var storage = new Storage();
var notifier = new Notifier();
var blacklist = new Blacklist(storage);
var poiCollection = new PoiCollection();
var tabData = {};
var mode = 'default';
var applicationTabs = {};

notifier.addListener('search', function(message, sender) {
  var address = message.address;

  if (message.engine === 'yandex') {
    var query = (message.type === 'contacts' ? '(inurl:contacts | inurl:address) ' : '') + (address.city ? '!!' + address.city + ' ' : '') + (address.street ? expandStreet(address.street) : (address.place ? address.place + ' ' : '')) + expandHousenumber(address.housenumber);
    var url = chrome.i18n.getMessage('search_url', encodeURIComponent(query));
    chrome.tabs.create({url: url, active: true, windowId: sender.windowId, index: sender.tab.index + 1}, function(tab) {
      tabData[tab.id] = {state: 'yandex', address: address, coords: message.coords};
      setMode('add');
      chrome.tabs.insertCSS(tab.id, {
        'file': 'inject/yandex.css'
      }, function() {
        chrome.tabs.executeScript(tab.id, {
          'file': 'inject/yandex.js'
        });
      });
    });
  }
});

notifier.addListener('blacklist.test', function(message, sender, callback) {
  callback(blacklist.test(message));
});

notifier.addListener('blacklist.add', function(message) {
  if (!blacklist.test(message)) {
    blacklist.add(message);
  }
});

notifier.addListener('editor.ready', function(message, sender, callback) {
  var data, tags;

  if (message.id === 0) {
    data = tabData[message.tabId] || {};

    if (data.tags) {
      tags = data.tags;
    } else {
      tags  = {};
      if (data.address) {
        if (data.address.housenumber)
          tags['addr:housenumber'] = data.address.housenumber;
        if (data.address.street)
          tags['addr:street'] = data.address.street;
        if (data.address.place)
          tags['addr:place'] = data.address.place;
      }
    }
    data.tags = tags;
  } else if (message.id > 0) {
    data = poiCollection.pois[message.id] || {};
    tags = data.tags || {};
  }
  callback(tags);
});

notifier.addListener('editor.save', function(message, sender, callback) {
  if (message.id === 0) {
    if (tabData[message.tabId]) {
      var poi = new Poi(tabData[message.tabId].coords, tabData[message.tabId].tags);
      poiCollection.addPoi(poi);
      delete tabData[message.tabId].tags;
      notifier.notify('poi.created', poi);
      callback(true);
    }
  } else if (message.id > 0) {
    if (poiCollection.pois[message.id]) {
      poiCollection.pois[message.id].tags = message.tags;
      callback(false);
    }
  }
});

notifier.addListener('editor.update', function(message, sender, callback) {
  var tags;

  if (message.id === 0) {
    if (tabData[message.tabId]) {
      tags = tabData[message.tabId].tags;
    }
  } else if (message.id > 0) {
    if (poiCollection.pois[message.id]) {
      tags = poiCollection.pois[message.id].tags;
    }
  }

  if (tags && message.tag) {
    if (message.value && message.value.length) {
      tags[message.tag] = message.value;
    } else {
      delete tags[message.tag];
    }
    if (message.id > 0) {
      notifier.notify('poi.tags', poiCollection.pois[message.id]);
    }
  }
});

notifier.addListener('app.download', function(message, sender, callback) {
  if (poiCollection.length) {
    poiCollection.saveToDisk();
    poiCollection.clear();
    notifier.notify('app.clear');
    callback(null, true);
  } else {
    callback('Набор данных пуст.');
  }
});

notifier.addListener('app.upload', function(message, sender, callback) {
  if (poiCollection.length) {
    poiCollection.upload(function(err, result) {
      if (!err) {
        poiCollection.clear();
        notifier.notify('app.clear');
      }
      callback(err, result);
    });
  } else {
    callback('Набор данных пуст.');
  }
});

notifier.addListener('app.ready', function(message, sender, callback) {
  callback(poiCollection.pois);
});

notifier.addListener('poi.coords', function(poiData) {
  var poi = poiCollection.pois[poiData.id];
  poi.coords = poiData.coords;
});

notifier.addListener('poi.removed', function(id) {
  poiCollection.removePoi(id);
});

chrome.browserAction.onClicked.addListener(function() {
  if (mode === 'default') {
    var appUrl = chrome.extension.getURL('/app/app.html');
    chrome.tabs.query({url: appUrl}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, {active: true});
      } else {
        chrome.tabs.create({active: true, url: appUrl});
      }
    });
  } else if (mode === 'add') {

  }
});

chrome.tabs.onCreated.addListener(function(tab) {
  if (tab.openerTabId && tabData[tab.openerTabId] && tab.url.indexOf('chrome') !== 0) {
    tabData[tab.id] = {state: 'third', address: tabData[tab.openerTabId].address, coords: tabData[tab.openerTabId].coords};
    if (tab.active) {
      setMode('add');
    }
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
	if (tabData[tabId]) {
    if (tabData[tabId].state === 'yandex') {
      chrome.tabs.insertCSS(tabId, {
        'file': 'inject/yandex.css'
      }, function() {
        chrome.tabs.executeScript(tabId, {
          'file': 'inject/yandex.js'
        });
      });
    }
	}
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  delete tabData[tabId];
});

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	delete tabData[removedTabId];
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  if (tabData[activeInfo.tabId]) {
    setMode('add');
  } else {
    setMode('default');
  }
});

var setMode = function(newMode) {
  if (newMode === 'add') {
    chrome.browserAction.setIcon({path: {'19': '/images/add_19x19.png', '38': '/images/add_38x38.png'}});
    chrome.browserAction.setTitle({title: 'Редактирование POI'});
    chrome.browserAction.setPopup({popup: '/popup/popup.html'});
    mode = newMode;
  } else if (newMode === 'default') {
    chrome.browserAction.setIcon({path: {'19': '/images/default_19x19.png', '38': '/images/default_38x38.png'}});
    chrome.browserAction.setTitle({title: 'Поиск POI'});
    chrome.browserAction.setPopup({popup: ''});
    mode = 'default';
  }
};
