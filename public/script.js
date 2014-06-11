var _ = require("minified");
function ready() {
  _.$("#filter").on("keyup",function() {
    var value = this[0].value, counter = 0;
    _.$("ul li .title").each(function(node) {
      if (node.innerHTML.indexOf(value) != -1) {
       node.parentNode.parentNode.style.display = "block"; counter++;
      } else {
       node.parentNode.parentNode.style.display = "none"; }
    });
    _.$(".filter-container em").fill("(" + counter + ")");
  });
}
_.$.ready(ready);
