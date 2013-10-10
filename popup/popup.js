var notifier, editor;

window.addEventListener('load', function() {
  notifier = new Notifier();
  editor = new Editor(document.querySelector('#tag-table'));
});
