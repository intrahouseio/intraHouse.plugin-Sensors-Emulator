const apiobj = require("./apiobj");

module.exports = function(plugin) {
  plugin.params = apiobj("params", plugin);

  plugin.users = apiobj("users", plugin);
  plugin.places = apiobj("places", plugin);
  plugin.rooms = apiobj("rooms", plugin);

  plugin.channels = apiobj("channels", plugin);
 
};
