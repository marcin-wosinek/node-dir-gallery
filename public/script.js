var _ = require("minified");

function ready() {
  // custom filters
  _.$("#filter").on("keyup", function() {
    var value = this[0].value,
      counter = 0;

    _.$("ul li .title").each(function(node) {
      if (node.innerHTML.indexOf(value) != -1) {
       node.parentNode.parentNode.style.display = "block";
       counter++;
      }
      else {
       node.parentNode.parentNode.style.display = "none"; }
    });

    _.$(".filter-container em").fill(counter);
  });

  // predefined filters
  _.$(".filter-item").on("click", function() {
    var value = this[0].getAttribute('href');

    _.$("#filter").set('value', value)
    .trigger('keyup');

    return false;
  });

  // switch small img
  _.$(".action-smallimg").on("click", function() {
    var value = _.$(document.body).is('.smaller') ? '-smaller' : '+smaller';
    _.$(document.body).set('$', value);
    return false;
  });
}
_.$.ready(ready);
