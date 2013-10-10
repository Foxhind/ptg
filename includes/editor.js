var Editor = function(table, id) {
  var that = this;

  this.tags = {};
  this.table = table;
  this.tabId = 0;
  this.id = id || 0;
  this.activeInput = null;
  this.oldValues = null;
  this.activeTagInput = null;
  this.activeValueInput = null;
  this.rulesUrl = chrome.extension.getURL('/includes/autocompletion.json');

  this.initAutocompletion();
  this.table.classList.add('editor');

  chrome.tabs.getSelected(null, function(tab) {
    notifier.notify('editor.ready', {tabId: tab.id, id: that.id}, function(tags) {
      that.tabId = tab.id;
      that.tags = tags;
      that.buildTable();
      for (var tag in that.tags) {
        if (that.tags.hasOwnProperty(tag)) {
          that.update(tag, that.tags[tag]);
        }
      }
    });
  });

  notifier.addListener('editor.update', function(message, sender, callback) {
    if (message.id === that.id && message.tabId !== that.tabId) {
      if (message.value && message.value.length) {
        that.tags[message.tag] = message.value;
      } else {
        delete that.tags[message.tag];
      }
      that.invalidateTable();
    }
  });

  var saveButton = document.body.querySelector('#save-button');
  if (saveButton) {
    saveButton.addEventListener('click', this.save.bind(this));
  }
};

Editor.prototype.invalidateTable = function() {
  function onFocus() {
    this.buildTable();
    window.removeEventListener('focus', bindedOnFocus);
  }
  var bindedOnFocus = onFocus.bind(this);

  window.addEventListener('focus', bindedOnFocus);
};

Editor.prototype.initAutocompletion = function() {
  if (document.body.querySelector('datalist#tags')) {
    return;
  }

  function response(data) {
    var tag,
        tags = [],
        id,
        values,
        globalValues = [];

    try {
      data = JSON.parse(data);
    }
    catch(e) {
      return;
    }

    if (data['*']) {
      globalValues = data['*'];
    }

    for (tag in data) {
      if (data.hasOwnProperty(tag)) {
        if (tag !== '*') {
          tags.push(tag);
        }
        values = data[tag];
        id = 'values-' + tag;

        if (typeof values === 'string' || values instanceof String) {
          values = [values];
        }

        if (values instanceof Array) {
          if (tag !== '*') {
            for (var i = 0; i < globalValues.length; i++) {
              values.push(globalValues[i]);
            }
          }
          this.createDatalist(id, values);
        }
      }
    }

    if (tags.length) {
      this.createDatalist('tags', tags);
    }
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

Editor.prototype.createDatalist = function(id, list) {
  var datalist = document.createElement('datalist');
  datalist.id = id;

  var option;
  for (var i = 0; i < list.length; i++) {
    option = document.createElement('option');
    option.setAttribute('value', list[i]);
    datalist.appendChild(option);
  }

  document.body.appendChild(datalist);
};

Editor.prototype.clearTable = function() {
  while (this.table.rows.length) {
    this.table.deleteRow(-1);
  }
};

Editor.prototype.destroy = function() {
  if (this.table && this.table.parentNode) {
    this.table.parentNode.removeChild(this.table);
  }
};

Editor.prototype.buildTable = function() {
  var that = this;

  this.clearTable();

  for (var tag in this.tags) {
    if (this.tags.hasOwnProperty(tag)) {
      this.addInputRow(tag, this.tags[tag]);
    }
  }
  that.addInputRow();

  var addButton = document.createElement('div');
  addButton.classList.add('button-add');
  addButton.addEventListener('click', function() {
    that.addInputRow(null, null, -2);
  });
  this.addRow([undefined, undefined, addButton]);
};

Editor.prototype.addRow = function(cells, position) {
  var row, cell;
  var position = position === undefined ? -1 : position;

  if (position < 0) {
    position = this.table.rows.length + position + 1;
  }
  row = this.table.insertRow(position);

  for (var i = 0; i < cells.length; i++) {
    cell = row.insertCell(-1);
    if (cells[i]) {
      cell.appendChild(cells[i]);
    }
  }

  return row;
};

Editor.prototype.addInputRow = function(tag, value, position) {
  var cells = [], valueInput, tagInput, button;
  var position = position === undefined ? -1 : position;
  var that = this;

  tagInput = document.createElement('input');
  tagInput.setAttribute('type', 'text');
  tagInput.setAttribute('list', 'tags');
  tagInput.classList.add('tag');
  tagInput.value = tag || '';
  tagInput.addEventListener('focus', this.onFocus.bind(this));
  tagInput.addEventListener('keydown', this.onKeyDown.bind(this));
  tagInput.addEventListener('keyup', this.onKeyUp.bind(this));
  tagInput.addEventListener('blur', this.onBlur.bind(this));
  cells.push(tagInput);

  valueInput = document.createElement('input');
  valueInput.setAttribute('type', 'text');
  valueInput.classList.add('value');
  valueInput.value = value || '';
  valueInput.addEventListener('focus', this.onFocus.bind(this));
  valueInput.addEventListener('keydown', this.onKeyDown.bind(this));
  valueInput.addEventListener('keyup', this.onKeyUp.bind(this));
  valueInput.addEventListener('blur', this.onBlur.bind(this));
  cells.push(valueInput);

  button = document.createElement('div');
  button.classList.add('button-remove');
  button.addEventListener('click', function() {
    row.parentNode.removeChild(row);
    if (tagInput.value && tagInput.value.length) {
      that.update(tagInput.value, null);
    }
  });
  cells.push(button);

  var row = this.addRow(cells, position);
  return row;
};

Editor.prototype.onFocus = function(e) {
  var row = e.target.parentNode.parentNode;
  this.activeTagInput = row.querySelector('input.tag');
  this.activeValueInput = row.querySelector('input.value');

  this.isLastRow = this.table.rows[this.table.rows.length - 2] === row;
  this.activeInput = e.target;
  this.oldValues = [this.activeTagInput.value, this.activeValueInput.value];
};

Editor.prototype.onKeyDown = function(e) {
  if (e.keyCode === 13 || e.keyCode === 9) {
    if (this.activeInput === this.activeTagInput) {
      this.activeValueInput.focus();
    } else if (this.activeInput === this.activeValueInput) {
      var row = this.activeInput.parentNode.parentNode;
      var nextRow;
      if (this.isLastRow) {
        nextRow = this.addInputRow(null, null, -2);
      } else {
        var rows = Array.prototype.slice.call(this.table.rows);
        var i = rows.indexOf(row) + 1;
        nextRow = this.table.rows[i];
      }
      var nextInput = nextRow.querySelector('input.tag');
      nextInput.focus();
    }
    e.preventDefault();
  } else if (e.keyCode === 83 && e.ctrlKey) {
    this.save();
    e.preventDefault();
  } else if (e.keyCode > 47 && e.keyCode < 91) {
    if (this.isLastRow) {
      this.addInputRow(null, null, -2);
      this.isLastRow = false;
    }
  }
};

Editor.prototype.onKeyUp = function(e) {
  if (this.activeInput === e.target) {
    if (e.target.classList.contains('tag')) {
      if (!this.tags[this.activeTagInput.value]) {
        this.update(this.oldValues[0], null);
        this.update(this.activeTagInput.value, this.oldValues[1]);
        this.oldValues[0] = this.activeTagInput.value;
      }
    } else {
      if (this.activeTagInput.value && this.activeTagInput.value.length) {
        this.update(this.activeTagInput.value, this.activeValueInput.value)
        this.oldValues[1] = this.activeValueInput.value;
      }
    }
  }
};

Editor.prototype.onBlur = function(e) {
  if (this.activeInput === e.target) {

    if (e.target.classList.contains('tag')) {
      if (this.tags[this.activeTagInput.value] && this.activeTagInput.value.length) {
        this.activeTagInput.value = this.oldValues[0];
      } else {
        this.update(this.oldValues[0], null);
        this.update(this.activeTagInput.value, this.oldValues[1]);
      }
      var datalistId = 'values-' + this.activeTagInput.value;
      this.activeValueInput.setAttribute('list', document.getElementById(datalistId) ? datalistId : 'values-*');
    } else {
      if (this.activeTagInput.value && this.activeTagInput.value.length) {
        this.update(this.activeTagInput.value, this.activeValueInput.value)
      }
    }

    this.activeInput = null;
    this.oldValues = null;
    this.activeTagInput = null;
    this.activeValueInput = null;
  }
};

Editor.prototype.update = function(tag, value) {
  if (value && value.length) {
    this.tags[tag] = value;
  } else {
    delete this.tags[tag];
  }
  notifier.notify('editor.update', {tabId: this.tabId, id: this.id, tag: tag, value: value});
};

Editor.prototype.save = function() {
  notifier.notify('editor.save', {tabId: this.tabId, id: this.id}, function(result) {
    if (result) {
      window.close();
    }
  });
};