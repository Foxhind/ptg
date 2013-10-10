(function() {
  var hostRe = /(?:[^\/]+\.)*([^.\/]+\.[^.\/]+)/;

  function testHost(host, item) {
    chrome.extension.sendMessage({name: 'blacklist.test', data: host}, function(response) {
      if (response) {
        item.classList.add('hidden');
      } else {
        addCrawlerBlock(item, host);
      }
    });
  }

  function processNode(node) {
    if (!node.querySelectorAll) return;
    var items = node.querySelectorAll('.b-serp-item:not(.z-news):not(.z-images):not(.z-misspell):not(.passed),.serp-item:not(.z-news):not(.z-images):not(.z-misspell):not(.passed)');
    var item;
    for (var i = 0; i < items.length; i++) {
      item = items[i];
      processItem(item);
    }
  }

  function processItem(item) {
    if (!item.querySelector) return;
    var link = item.querySelector('.b-serp-item__title-link,.serp-item__title-link');
    if (link) {
      var href = link.getAttribute('href');
      if (href) {
        href = hostRe.exec(href);
        if (href[1]) {
          var host = href[1].toLowerCase();
          testHost(host, item);
        }
      }
    }
    item.classList.add('passed');
  }

  function addCrawlerBlock(item, host) {
    var crawlerBlock = document.createElement('div');
    crawlerBlock.setAttribute('class', 'b-serp-item__rater');

    var buttonBad = document.createElement('div');
    buttonBad.setAttribute('class', 'b-serp-item__button-bad');
    buttonBad.addEventListener('click', function() {
      chrome.extension.sendMessage({name: 'blacklist.add', data: host});
      item.classList.add('hidden');
      this.parentNode.parentNode.removeChild(this.parentNode);
    });

    crawlerBlock.appendChild(buttonBad);

    item.insertBefore(crawlerBlock);
  }

  processNode(document.body);

  var observer = new window.WebKitMutationObserver(function(mutations) {
    var mutation, item;
    for (var i = 0; i < mutations.length; i++) {
      mutation = mutations[i];
      if (mutation.addedNodes.length > 0) {
        for (var j = 0; j < mutation.addedNodes.length; j++) {
          processNode(mutation.addedNodes[j]);
        }
      }
    }
  });
  observer.observe(document.body, {subtree: true, childList: true});
})();
