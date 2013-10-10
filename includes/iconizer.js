var Iconizer = function() {
  this.iconPath = chrome.extension.getURL('/images/icons/');
  this.rulesUrl = chrome.extension.getURL('/app/rules.json');
  this.defaultIcon = L.icon({
    iconUrl: this.iconPath + 'default.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [8, 8],
    shadowUrl: this.iconPath + 'shadow.png',
    shadowSize: [26, 26],
    shadowAnchor: [13, 13]
  });

  this.rules = [];
  this.getRules(this.loadRules.bind(this));
};

Iconizer.prototype.loadRules = function(rules) {
  var rule, iconUrl;
  for (var i = 0; i < rules.length; i++) {
    rule = rules[i];
    rule.icon = L.icon({
      iconUrl: this.iconPath + rule.icon,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [8, 8],
      shadowUrl: this.iconPath + 'shadow.png',
      shadowSize: [26, 26],
      shadowAnchor: [13, 13]
    });
  }
  this.rules = rules;
};

Iconizer.prototype.getRules = function(callback) {
  function response(data) {
    var rules;
    try {
      rules = JSON.parse(data);
    }
    catch(e) {
      return;
    }

    callback(rules);
  }

  var bindedResponse = response.bind(this);
  var request = new XMLHttpRequest();
  request.open('GET', this.rulesUrl);
  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if(request.status === 200) {
        bindedResponse(request.responseText);
      }
    }
  };
  request.send();
};

Iconizer.prototype.getIcon = function(tags) {
  var rule, tag, value, match;

  for (var i = 0; i < this.rules.length; i++) {
    rule = this.rules[i];
    match = true;
    for (tag in rule.tags) {
      if (!rule.tags.hasOwnProperty(tag)) continue;
      if (!tags.hasOwnProperty(tag)) {
        match = false;
        break;
      }
      value = rule.tags[tag];
      if (value === true || value === tags[tag]) continue;
      match = false;
      break;
    }

    if (match) {
      return rule.icon;
    }
  }

  return this.defaultIcon;
};
