var notifier = new Notifier();
var storage = new Storage();
var iconizer = new Iconizer();

var crc32 = {
  table: "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D",
  utf8Encode: function(string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  },
  calc: function(str) {
    str = this.utf8Encode(str);
    var crc;

    if (typeof(crc) == "undefined") { crc = 0; }
    var x = 0;
    var y = 0;

    crc = crc ^ (-1);
    for (var i = 0, iTop = str.length; i < iTop; i++ ) {
      y = (crc ^ str.charCodeAt( i )) & 0xFF;
      x = parseInt(this.table.substr(y * 9, 8), 16);
      crc = (crc >>> 8) ^ x;
    }

    return crc ^ (-1);
  }
};

var Popup = function(type, message, container) {
  this.hash = crc32.calc(type + message);
  this.type = type;
  this.message = message;
  this.container = container;

  Popup.prototype.show = function(time, callback) {
    this.div = document.createElement('div');
    this.div.classList.add('popup');
    this.div.classList.add(this.type);
    this.div.innerText = this.message;
    this.container.appendChild(this.div);

    this.timer = setTimeout(this.hide.bind(this), time);
    this.removeCallback = callback;
  };

  Popup.prototype.refresh = function(time, callback) {
    clearTimeout(this.timer);
    this.timer = setTimeout(this.hide.bind(this), time);
    if (callback) {
      this.removeCallback = callback;
    }
  }

  Popup.prototype.hide = function() {
    clearTimeout(this.timer);

    this.container.removeChild(this.div);

    if (this.removeCallback) {
      this.removeCallback();
    }
  }
};

var view = {
  popups: {},
  markers: {},
  init: function() {
    this.panelAddress = document.querySelector('#panel-address');
    this.panelPoi = document.querySelector('#panel-poi');
    this.panelExport = document.querySelector('#panel-export');

    this.mapContainer = document.querySelector('#map');

    this.yandexLinkContacts = document.querySelector('#yandex-link-contacts');
    this.yandexLinkContacts.addEventListener('click', (function(e) {
      e.preventDefault();
      if (controller.currentAddress) {
        notifier.notify('search', {engine: 'yandex', type: 'contacts', coords: controller.currentCoords, address: {city: controller.currentAddress.city, street: controller.currentAddress.street, place: controller.currentAddress.place, housenumber: controller.currentAddress.housenumber}});
      }
    }).bind(this));

    this.yandexLink = document.querySelector('#yandex-link');
    this.yandexLink.addEventListener('click', (function(e) {
      e.preventDefault();
      if (controller.currentAddress) {
        notifier.notify('search', {engine: 'yandex', coords: controller.currentCoords, address: {city: controller.currentAddress.city, street: controller.currentAddress.street, place: controller.currentAddress.place, housenumber: controller.currentAddress.housenumber}});
      }
    }).bind(this));

    this.popupContainer = document.querySelector('#popup-container');

    this.downloadLink = document.querySelector('#download-link');
    this.downloadLink.addEventListener('click', (function(e) {
      var that = this;
      e.preventDefault();
      notifier.notify('app.download', null, function(err, result) {
        if (err) {
          that.showMessage('error', err);
        } else if (result) {
          that.showMessage('warning', 'Загрузка началась.');
        }
      });
    }).bind(this));

    this.uploadLink = document.querySelector('#upload-link');
    this.uploadLink.addEventListener('click', (function(e) {
      var that = this;
      e.preventDefault();
      notifier.notify('app.upload', null, function(err, result) {
        if (err) {
          that.showMessage('error', err);
        } else if (result) {
          that.showMessage('warning', 'Данные выгружены.');
        }
      });
    }).bind(this));

    this.removeButton = document.querySelector('#remove-button');
    this.removeButton.addEventListener('click', (function() {
      if (this.editor && this.editor.id) {
        notifier.notify('poi.removed', this.editor.id);
      }
    }).bind(this));

    this.editorPlaceholder = document.querySelector('#editor-placeholder');

    this.panelPoi.style.display = 'none';
    this.panelAddress.style.display = 'none';
  },

  setAddress: function(address) {
    if (address) {
      address = (address.city ? address.city + ', ' : '') + (address.street ? address.street + ', ' : (address.place ? address.place + ', ' : ''))  + address.housenumber;
      this.panelAddress.querySelector('.address').textContent = address;
      this.panelAddress.style.display = 'block';
    } else {
      this.panelAddress.querySelector('.address').textContent = '';
      this.panelAddress.style.display = 'none';
    }
  },

  showMessage: function(type, message) {
    var time = type === 'error' ? 3000 : 2000;
    var popup = new Popup(type, message, this.popupContainer);
    if (this.popups[popup.hash]) {
      this.popups[popup.hash].refresh(time);
    } else {
      this.popups[popup.hash] = popup;
      popup.show(time, (function() {
        delete this.popups[popup.hash];
      }).bind(this));
    }
  },

  removeMessage: function(popup) {
    popup.hide();
    delete this.popups[popup.hash];
  },

  setMapCursor: function(cursor) {
    this.mapContainer.style.cursor = cursor;
  },

  updateEditor: function(id) {
    if (this.editor) {
      if (this.editor.id === id) {
        return;
      }
      this.editor.destroy();
      this.editor = null;
    }

    if (id === undefined || id === null) {
      this.panelPoi.style.display = 'none';
    } else {
      var table = document.createElement('table');
      this.panelPoi.insertBefore(table, this.editorPlaceholder);
      this.editor = new Editor(table, id);

      this.panelPoi.style.display = 'block';
    }
  }
};

var controller = {
  currentAddress: null,
  vectorLayer: null,
  queryInProcess: false,
  lineOptions: {color: '#d30000', weight: 3, fillColor: '#d30000', fillOpacity: 0.4},
  requests: [],
  overpassQuery: function() {
    var that = this;
    var coords = {lat: that.lastClick.lat, lng: that.lastClick.lng};

    this.setStatus('query');

    var requestAddress = new XMLHttpRequest();
    var requestPlace = new XMLHttpRequest();
    requestAddress.id = this.requests.push(requestAddress) - 1;
    requestPlace.id = this.requests.push(requestPlace) - 1;

    async.parallel([
      function(callback) {
        var query = '[out:json];(node(around:10.0,' + that.lastClick.lat + ',' + that.lastClick.lng + ')["addr:housenumber"];way(around:10.0,' + that.lastClick.lat + ',' + that.lastClick.lng + ')["addr:housenumber"];relation(around:10.0,' + that.lastClick.lat + ',' + that.lastClick.lng + ')["addr:housenumber"];);(._;>;);out body;';
        requestAddress.onreadystatechange = function() {
          if (requestAddress.readyState == 4) {
            if(requestAddress.status == 200) {
              var response;
              try {
                response = JSON.parse(requestAddress.responseText);
              } catch(e) {
                callback('Ошибка в ответе OverPass API.', null);
                return;
              }
              callback(null, response);
            } else {
              callback('Ошибка HTTP' + (requestAddress.status ? ' ' + requestAddress.status : '') + '.', null);
            }
          }
        };
        //this.request.open('POST', 'http://overpass.osm.rambler.ru/cgi/interpreter');
        requestAddress.open('POST', 'http://overpass-api.de/api/interpreter');
        requestAddress.send(query);
      },
      function(callback) {
        var url = 'http://open.mapquestapi.com/nominatim/v1/reverse.php?format=json&accept-language=ru&addressdetails=1&zoom=16&lat=' + that.lastClick.lat + '&lon=' + that.lastClick.lng + '&email=foxhind@gmail.com';
        //var url = 'http://nominatim.openstreetmap.org/reverse?format=json&accept-language=ru&addressdetails=1&zoom=16&lat=' + that.lastClick.lat + '&lon=' + that.lastClick.lng + '&email=foxhind@gmail.com';
        requestPlace.onreadystatechange = function() {
          if (requestPlace.readyState == 4) {
            if(requestPlace.status == 200) {
              var response;
              try {
                response = JSON.parse(requestPlace.responseText);
              } catch(e) {
                callback('Ошибка в ответе Nominatim API.', null);
                return;
              }
              callback(null, response);
            } else {
              callback('Ошибка HTTP' + (requestPlace.status ? ' ' + requestPlace.status : '') + '.', null);
            }
          }
        };
        requestPlace.open('GET', url);
        requestPlace.send();
      }],
      function(err, results) {
        delete that.requests[requestAddress.id];
        delete that.requests[requestPlace.id];

        if (err) {
          view.showMessage('error', err);
          return;
        }
        that.setStatus('idle');
        that.overpassHandler(results, coords);
      }
    );
  },

  setStatus: function(status) {
    this.status = status;
    if (status == 'query') {
      view.setMapCursor('wait');
    } else {
      view.setMapCursor('default');
    }
  },

  createWay: function(way, elements) {
    var node, nodeId,
        result = [];
    for (var i = 0; i < way.nodes.length; i++) {
      nodeId = way.nodes[i];
      if (i > 0 && nodeId == way.nodes[0]) break;
      node = elements.node[nodeId];
      if (node === undefined) break;
      result.push(new L.LatLng(node.lat, node.lon));
    }
    return result;
  },

  createMultiPolygon: function(multipolygon, elements) {
    var member, way, wayId,
        result = [];
    for (var i = 0; i < multipolygon.members.length; i++) {
      member = multipolygon.members[i];
      if (member.ref === undefined) break;
      if (member.type != 'way') continue;
      wayId = member.ref;
      way = elements.way[wayId];
      if (way === undefined) break;

      way = this.createWay(way, elements);

      result.push(way);
    }
    return result;
  },

  overpassHandler: function(data, coords) {
    // Overpass
    var candidates = {
          node: [],
          way: [],
          relation: []
        },
        elements = {
          node: {},
          way: {},
          relation: {}
        };

    var element;
    for (var i = 0; i < data[0].elements.length; i++) {
      element = data[0].elements[i];

      // Candidate detection
      if (element.tags && element.tags['addr:housenumber'] && (element.tags['addr:street'] || element.tags['addr:place'] || element.tags['addr:city'])) {
        candidates[element.type].push(element);
      }

      elements[element.type][element.id] = element;
    }

    if (candidates.node.length > 0) {
      element = candidates.node[0];
      this.vectorLayer = new L.CircleMarker(new L.LatLng(element.lat, element.lon), this.lineOptions);
    } else if (candidates.way.length > 0) {
      element = candidates.way[0];
      this.vectorLayer = new L.Polygon(this.createWay(element, elements), this.lineOptions);
    } else if (candidates.relation.length > 0) {
      element = candidates.relation[0];
      this.vectorLayer = new L.MultiPolygon(this.createMultiPolygon(element, elements), this.lineOptions);
    } else {
      if (data[0].elements.length > 0) {
        view.showMessage('warning', 'Нет объектов с полным адресом.');
      }
      return;
    }

    // Nominatim
    var city;
    if (data[1].address) {
      city = data[1].address.city || data[1].address.town || data[1].address.village || data[1].address.allotments;
      var state = data[1].address.state;
      if (state == 'Москва' || state == 'Санкт-Петербург') {
        city = state;
      }
    }

    if (element !== undefined) {
      this.vectorLayer.on('click', function(e) {
        e.originalEvent.stopPropagation();
      });
      this.map.addLayer(this.vectorLayer);

      if (element.tags['addr:city']) {
        city = element.tags['addr:city'];
      }

      this.currentAddress = {city: city, street: element.tags['addr:street'], place: element.tags['addr:place'], housenumber: element.tags['addr:housenumber']};
      this.currentCoords = coords;
      view.setAddress(this.currentAddress);
    }
  },

  init: function() {
    var that = this;

    var mapquest = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg', {
        attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, tiles © <a target="_blank" href="http://www.mapquest.com/">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
        maxZoom: 18,
        subdomains: '1234'
    });

    var mapsurfer = L.tileLayer('http://129.206.74.245:8001/tms_r.ashx?x={x}&y={y}&z={z}', {
        attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, rendering <a href="http://giscience.uni-hd.de/" target="_blank">GIScience Research Group @ University of Heidelberg</a>',
        maxZoom: 18
    });

    var mapnikbw = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 18,
        subdomains: 'ab'
    });

    var mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 18,
        subdomains: 'abc'
    });

    this.markerLayer = L.layerGroup();

    this.map = L.map('map', {layers: [mapnik, this.markerLayer]});

    L.control.layers({'Mapnik': mapnik, 'Mapnik B&W': mapnikbw, 'MapSurfer': mapsurfer, 'MapQuest': mapquest}).addTo(this.map);

    this.map.on('click', function(e) {
      view.updateEditor(null);
      if (that.status == 'query') {
        view.showMessage('warning', 'Уже выполняется запрос.');
        return;
      }
      if (e.target.getZoom() > 15) {
        that.currentAddress = null;
        view.setAddress(null);

        if (that.vectorLayer) {
          that.map.removeLayer(that.vectorLayer);
          that.vectorLayer = null;
        }

        that.lastClick = e.latlng;
        that.overpassQuery();
      } else {
        view.showMessage('warning', 'Сначала приблизьте интересующую вас область.');
      }
    });

    this.map.on('moveend', function() {
      storage.set('map.center', that.map.getCenter());
    });

    this.map.on('zoomend', function() {
      storage.set('map.zoom', that.map.getZoom());
    });

    // Positioning
    async.parallel([
      function(callback) {
        storage.get('map.center', callback);
      },
      function(callback) {
        storage.get('map.zoom', callback);
      }
    ],
      function(err, results) {
        if (err) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var accuracy = position.coords.accuracy;
            if (accuracy < 1) {
              accuracy = 1;
            } else if (accuracy > 20003930) {
              accuracy = 20003930;
            }
            var zoom = 19 - Math.ceil(Math.log(Math.ceil(accuracy / 20003930 * 262144)) / Math.LN2);
            if (zoom > 18) zoom = 18;
            that.map.setView([position.coords.latitude, position.coords.longitude], zoom);
          });
        } else {
          that.map.setView(results[0], results[1]);
        }
      }
    );

    // Listeners
    notifier.addListener('poi.created', function(poi) {
      that.addPoiMarker(poi);
    });

    notifier.addListener('poi.removed', function(id) {
      var marker = view.markers[id];
      delete view.markers[id];

      that.markerLayer.removeLayer(marker);

      if (view.editor && view.editor.id === id) {
        view.updateEditor(null);
      }
    });

    notifier.addListener('poi.coords', function(poiData) {
      var marker = view.markers[poiData.id];
      if (marker) {
        marker.setLatLng(poiData.coords);
      }
    });

    notifier.addListener('app.clear', function() {
      for (var id in view.markers) {
        if (view.markers.hasOwnProperty(id)) {
          that.markerLayer.removeLayer(view.markers[id]);
        }
      }
      view.markers = {};
      view.updateEditor(null);
    });

    notifier.addListener('poi.tags', function(poiData) {
      var marker = view.markers[poiData.id];
      var newIcon = iconizer.getIcon(poiData.tags);
      if (marker && marker.options.icon !== newIcon) {
        marker.setIcon(newIcon);
      }
    });

    window.addEventListener('keydown', function(e) {
      if (e.keyCode === 46 && view.editor && view.editor.id > 0 && view.editor.activeInput === null) {
        notifier.notify('poi.removed', view.editor.id);
      }
    });

    // App ready
    notifier.notify('app.ready', null, function(pois) {
      for (var id in pois) {
        if (pois.hasOwnProperty(id)) {
          that.addPoiMarker(pois[id]);
        }
      };
    });
  },

  addPoiMarker: function(poi) {
    if (!poi || !poi.coords || !poi.id) return;

    function onClick() {
      if (this.vectorLayer) {
        this.map.removeLayer(this.vectorLayer);
        this.vectorLayer = null;
      }
      view.setAddress(null);
      view.updateEditor(poi.id);
    }

    function onDragend(e) {
      notifier.notify('poi.coords', {id: poi.id, coords: e.target.getLatLng()});
    }

    var marker = L.marker(poi.coords, {draggable: true, icon: iconizer.getIcon(poi.tags), riseOnHover: true});
    marker.on('click', onClick.bind(this));
    marker.on('dragend', onDragend.bind(this));
    view.markers[poi.id] = marker;
    this.markerLayer.addLayer(marker);
  }

};

window.addEventListener('load', function() {
  view.init();
  controller.init();
});