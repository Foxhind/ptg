/*
  Base64 implementation by dankogai
  https://github.com/dankogai/js-base64
*/
(function(global){"use strict";if(global.Base64)return;var version="2.1.2";var buffer;if(typeof module!=="undefined"&&module.exports){buffer=require("buffer").Buffer}var b64chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var b64tab=function(bin){var t={};for(var i=0,l=bin.length;i<l;i++)t[bin.charAt(i)]=i;return t}(b64chars);var fromCharCode=String.fromCharCode;var cb_utob=function(c){if(c.length<2){var cc=c.charCodeAt(0);return cc<128?c:cc<2048?fromCharCode(192|cc>>>6)+fromCharCode(128|cc&63):fromCharCode(224|cc>>>12&15)+fromCharCode(128|cc>>>6&63)+fromCharCode(128|cc&63)}else{var cc=65536+(c.charCodeAt(0)-55296)*1024+(c.charCodeAt(1)-56320);return fromCharCode(240|cc>>>18&7)+fromCharCode(128|cc>>>12&63)+fromCharCode(128|cc>>>6&63)+fromCharCode(128|cc&63)}};var re_utob=/[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;var utob=function(u){return u.replace(re_utob,cb_utob)};var cb_encode=function(ccc){var padlen=[0,2,1][ccc.length%3],ord=ccc.charCodeAt(0)<<16|(ccc.length>1?ccc.charCodeAt(1):0)<<8|(ccc.length>2?ccc.charCodeAt(2):0),chars=[b64chars.charAt(ord>>>18),b64chars.charAt(ord>>>12&63),padlen>=2?"=":b64chars.charAt(ord>>>6&63),padlen>=1?"=":b64chars.charAt(ord&63)];return chars.join("")};var btoa=global.btoa||function(b){return b.replace(/[\s\S]{1,3}/g,cb_encode)};var _encode=buffer?function(u){return new buffer(u).toString("base64")}:function(u){return btoa(utob(u))};var encode=function(u,urisafe){return!urisafe?_encode(u):_encode(u).replace(/[+\/]/g,function(m0){return m0=="+"?"-":"_"}).replace(/=/g,"")};var encodeURI=function(u){return encode(u,true)};var re_btou=new RegExp(["[У-У][Т-ТП]","[У -УЏ][Т-ТП]{2}","[УА-УЗ][Т-ТП]{3}"].join("|"),"g");var cb_btou=function(cccc){switch(cccc.length){case 4:var cp=(7&cccc.charCodeAt(0))<<18|(63&cccc.charCodeAt(1))<<12|(63&cccc.charCodeAt(2))<<6|63&cccc.charCodeAt(3),offset=cp-65536;return fromCharCode((offset>>>10)+55296)+fromCharCode((offset&1023)+56320);case 3:return fromCharCode((15&cccc.charCodeAt(0))<<12|(63&cccc.charCodeAt(1))<<6|63&cccc.charCodeAt(2));default:return fromCharCode((31&cccc.charCodeAt(0))<<6|63&cccc.charCodeAt(1))}};var btou=function(b){return b.replace(re_btou,cb_btou)};var cb_decode=function(cccc){var len=cccc.length,padlen=len%4,n=(len>0?b64tab[cccc.charAt(0)]<<18:0)|(len>1?b64tab[cccc.charAt(1)]<<12:0)|(len>2?b64tab[cccc.charAt(2)]<<6:0)|(len>3?b64tab[cccc.charAt(3)]:0),chars=[fromCharCode(n>>>16),fromCharCode(n>>>8&255),fromCharCode(n&255)];chars.length-=[0,0,2,1][padlen];return chars.join("")};var atob=global.atob||function(a){return a.replace(/[\s\S]{1,4}/g,cb_decode)};var _decode=buffer?function(a){return new buffer(a,"base64").toString()}:function(a){return btou(atob(a))};var decode=function(a){return _decode(a.replace(/[-_]/g,function(m0){return m0=="-"?"+":"/"}).replace(/[^A-Za-z0-9\+\/]/g,""))};global.Base64={VERSION:version,atob:atob,btoa:btoa,fromBase64:decode,toBase64:encode,utob:utob,encode:encode,encodeURI:encodeURI,btou:btou,decode:decode};if(typeof Object.defineProperty==="function"){var noEnum=function(v){return{value:v,enumerable:false,writable:true,configurable:true}};global.Base64.extendString=function(){Object.defineProperty(String.prototype,"fromBase64",noEnum(function(){return decode(this)}));Object.defineProperty(String.prototype,"toBase64",noEnum(function(urisafe){return encode(this,urisafe)}));Object.defineProperty(String.prototype,"toBase64URI",noEnum(function(){return encode(this,true)}))}}})(this);

var Poi = function(coords, tags) {
  this.id = 0;
  this.coords = coords || {lat: 0, lng: 0};
  this.tags = tags || {};
};

var PoiCollection = function() {
  this.counter = 0;
  this.clear();
};

PoiCollection.prototype.clear = function() {
  this.pois = {};
  this.length = 0;
};

PoiCollection.prototype.addPoi = function(poi) {
  this.counter += 1;
  this.length += 1;
  poi.id = this.counter;
  this.pois[poi.id] = poi;
};

PoiCollection.prototype.removePoi = function(id) {
  delete this.pois[id];
  this.length -= 1;
};

PoiCollection.prototype.createOsm = function() {
  var osm = document.createElement('osm');
  osm.setAttribute('version', '0.6');
  osm.setAttribute('upload', 'true');
  osm.setAttribute('generator', 'POI Crawler');
  for (var id in this.pois) {
    if (this.pois.hasOwnProperty(id)) {
      osm.appendChild(this.createNode(this.pois[id]));
    }
  }
  return osm;
};

PoiCollection.prototype.createNode = function(poi) {
  var node = document.createElement('node');
  node.setAttribute('id', (0-poi.id).toString());
  node.setAttribute('action', 'modify');
  node.setAttribute('visible', 'true');
  node.setAttribute('lat', poi.coords.lat.toString());
  node.setAttribute('lon', poi.coords.lng.toString());
  for (var tag in poi.tags) {
    if (poi.tags.hasOwnProperty(tag)) {
      node.appendChild(this.createTag(tag, poi.tags[tag]));
    }
  }
  return node;
};

PoiCollection.prototype.createTag = function(k, v) {
  var tag = document.createElement('tag');
  tag.setAttribute('k', k.toString());
  tag.setAttribute('v', v.toString());
  return tag;
};

PoiCollection.prototype.saveToDisk = function() {

  function base64ToBinary(data) {
    var raw = window.atob(data);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (i = 0; i < rawLength; ++i) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }

  function createFilename() {
    var date = new Date();
    var d = date.getDay();
    d = d > 9 ? d : '0' + d;
    var m = date.getMonth();
    m = m > 9 ? m : '0' + m;

    return 'poi_' + date.getFullYear() + '-' + m + '-' + d + '_' + date.toLocaleTimeString().replace(':', '-') + '.osm';
  }

  var osm = this.createOsm();
  osm = "<?xml version='1.0' encoding='UTF-8'?>" + osm.outerHTML;
  osm = Base64.encode(osm);
  osm = base64ToBinary(osm);
  var blob = new Blob([osm], {type: 'application/octet-stream'});

  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = createFilename();

  var event = document.createEvent('Event');
  event.initEvent('click', true, true);
  a.dispatchEvent(event);
};

PoiCollection.prototype.upload = function(callback) {
  function onReadyStateChange() {
    if (request.readyState === 4) {
      if (request.status === 200) {
        var response;
        try {
          response = JSON.parse(request.responseText);
        } catch(e) {
          if (callback) {
            callback('Неверный ответ сервера публикации.', null);
          }
          return;
        }
        if (response.id) {
          this.josmImport(response.id, callback);
        } else if (response.error) {
          if (callback) {
            callback(response.error, null);
          }
          return;
        }
      } else {
        if (callback) {
          callback('Неверный ответ сервера публикации.', null);
        }
        return;
      }
    }
  }

  var osm = this.createOsm();
  osm = 'osm=' + encodeURIComponent("<?xml version='1.0' encoding='UTF-8'?>" + osm.outerHTML);

  var request = new XMLHttpRequest();
  request.open('POST', 'http://poi.nanodesu.ru/publish.php');
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  request.onreadystatechange = onReadyStateChange.bind(this);
  request.send(osm);
};

PoiCollection.prototype.josmImport = function(id, callback) {
  function onReadyStateChange() {
    if (request.readyState === 4) {
      if (request.status === 200) {
        clearTimeout(timeout);
        callback(null, true);
      } else if (request.status === 400) {
        clearTimeout(timeout);
        var re = />([^<]*)<\/body>/i;
        var response = re.match(request.responseText);
        response = response[1] || 'Неизвестная ошибка JOSM';
        callback(response, null);
      }
    }
  }

  function onTimeout() {
    if (callback) {
      callback('JOSM не отвечает. Возможно, он не запущен, или отключено удалённое управление.', null);
    }
  }

  var timeout;
  var request = new XMLHttpRequest();
  request.open('GET', 'http://127.0.0.1:8111/import?url=http://poi.nanodesu.ru/take.php?id=' + id);
  request.onreadystatechange = onReadyStateChange.bind(this);
  timeout = setTimeout(onTimeout, 1000);
  request.send();
};