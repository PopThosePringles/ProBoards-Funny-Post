"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Funny_Post = function () {
	function Funny_Post() {
		_classCallCheck(this, Funny_Post);
	}

	_createClass(Funny_Post, null, [{
		key: "init",
		value: function init() {
			if (typeof yootil == "undefined") {
				console.warn("The plugin \"Funny Post\" needs Yootil.");

				return;
			}

			this.PLUGIN_ID = "pd_funny_post";
			this.PLUGIN_POST_KEY = "pd_funny_post";
			this.PLUGIN_USER_KEY = "pd_funny_user";
			this.LOOKUP = new Map();
			this.using_custom = false;

			this.IMAGES = {};
			this.SETTINGS = {};

			this.thread_check = yootil.location.recent_posts() || yootil.location.search_results() || yootil.location.thread();

			this.setup();

			$(this.ready.bind(this));
		}
	}, {
		key: "ready",
		value: function ready() {
			var _this = this;

			if (this.thread_check) {
				yootil.event.after_search(function () {

					_this.create_elements.bind(_this)();
					_this.create_funny_reactions.bind(_this)();
				});

				this.create_elements();
				this.create_funny_reactions();
			}
		}
	}, {
		key: "setup",
		value: function setup() {
			var plugin = pb.plugin.get(this.PLUGIN_ID);

			if (plugin && plugin.settings) {
				this.SETTINGS = plugin.settings;
				this.IMAGES = plugin.images;

				if (this.thread_check) {
					var post_data = proboards.plugin.keys.data[this.PLUGIN_POST_KEY];

					for (var key in post_data) {
						this.LOOKUP.set(parseInt(key, 10), new Funny_Post_Data(key, post_data[key]));
					}
				}
			}
		}
	}, {
		key: "get_data",
		value: function get_data(post_id) {
			post_id = parseInt(post_id, 10);

			if (!this.LOOKUP.has(post_id)) {
				this.LOOKUP.set(post_id, new Funny_Post_Data(post_id));
			}

			return this.LOOKUP.get(post_id);
		}
	}, {
		key: "create_elements",
		value: function create_elements() {
			var $posts = $("tr.item[id^=post-]");

			$posts.each(function () {
				var post_id = Funny_Post.fetch_post_id(this);
				var $content = $(this).find("td.content");
				var post_created_by = parseInt(pb.data("proboards.post")[post_id].created_by, 10);

				Funny_Post.show_in_mini_profile($(this).find(".mini-profile"), post_created_by);

				if ($content.length == 1 && post_id) {
					var user_id = yootil.user.id();

					var data = Funny_Post.get_data(post_id);
					var opacity = data.contains(user_id) ? 1 : 0.3;
					var $container = $("<div data-funny-post='" + post_id + "' class='funny-post-container'></div>");
					var $info = $("<span data-funny-post='" + post_id + "' class='funny-post-info'></span>");
					var $button = $("<img data-funny-post='" + post_id + "' class='funny-post-button' />");

					$button.attr("src", Funny_Post.SETTINGS.funny_image ? Funny_Post.SETTINGS.funny_image : Funny_Post.IMAGES.lol);
					$button.css("opacity", opacity);

					$button.on("mouseover", function () {

						$button.css("opacity", 1);
					});

					$button.on("mouseout", function () {

						if (data.contains(user_id)) {
							opacity = 1;
						} else {
							opacity = 0.5;
						}

						$button.css("opacity", opacity);
					});

					$button.on("click", Funny_Post.button_handler.bind($button, post_id, user_id, post_created_by));

					$container.append($info);
					$container.append($button);
					$content.append($container);
				}
			});
		}
	}, {
		key: "button_handler",
		value: function button_handler(post_id, user_id, post_created_by) {
			if (!yootil.key.write(Funny_Post.PLUGIN_POST_KEY, post_id)) {
				pb.window.alert("Permission Denied", "You do not have the permission to write to the key for the Funny Post plugin.");
				return false;
			} else if (yootil.key.space_left(Funny_Post.PLUGIN_POST_KEY) <= 35) {
				pb.window.alert("Post Key Full", "Unfortunately your reaction cannot be saved for this post, as it is out of space.");
				return false;
			}

			var post_data = Funny_Post.get_data(post_id);
			var has_loled = post_data && post_data.contains(user_id) ? true : false;

			if (!has_loled) {
				Funny_Post.add(post_id, user_id);

				if (post_created_by && (post_created_by != user_id || Funny_Post.SETTINGS.own_post_increment == 1)) {
					Funny_Post.increment_user_count(post_created_by);
				}
			} else {
				Funny_Post.remove(post_id, user_id);

				if (post_created_by && (post_created_by != user_id || Funny_Post.SETTINGS.own_post_increment == 1)) {
					Funny_Post.decrement_user_count(post_created_by);
				}
			}

			return false;
		}
	}, {
		key: "create_funny_reactions",
		value: function create_funny_reactions() {
			var _this2 = this;

			this.LOOKUP.forEach(function (val, key, m) {

				_this2.update_post(key);
			});
		}
	}, {
		key: "add",
		value: function add(post_id, user_id) {
			$(".funny-post-button[data-funny-post='" + post_id + "']").css("opacity", 1);

			var post_data = Funny_Post.get_data(post_id);

			post_data.add(user_id, yootil.user.name());

			Funny_Post.update_post(post_id);
		}
	}, {
		key: "remove",
		value: function remove(post_id, user_id) {
			var post_data = Funny_Post.get_data(post_id);

			post_data.remove(user_id);

			this.update_post(post_id);

			$(".funny-post-button[data-funny-post='" + post_id + "']").css("opacity", .3);
		}
	}, {
		key: "fetch_post_id",
		value: function fetch_post_id(post) {
			var post_id_parts = ($(post).attr("id") || "").split("-");

			if (post_id_parts && post_id_parts.length == 2) {
				return parseInt(post_id_parts[1], 10);
			}

			return 0;
		}
	}, {
		key: "update_post",
		value: function update_post(post_id) {
			var data = Funny_Post.get_data(post_id).data;
			var $info = $(".funny-post-info[data-funny-post='" + post_id + "']");

			if ($info.length == 1) {
				$info.empty();

				if (data.u.length > 0) {
					var $elem = $("<span class='funny-post-loled'></span>");
					var html = "";

					if (data.l.length > 0) {
						for (var i = 0; i < data.l.length; ++i) {
							var user_id = parseInt(data.l[i].u, 10);
							var name = yootil.html_encode(data.l[i].n, true);

							html += "<a href='/user/" + user_id + "' class='user-link js-user-link user-" + user_id + "' itemprop='url'><span itemprop='name'>" + name + "</span></a>";

							if (i < data.l.length - 1) {
								html += ",";
							}

							html += " ";
						}
					}

					if (data.l.length == 0 && data.u.length > 0) {
						html += data.u.length;
					} else if (data.u.length > data.l.length) {
						html += "and " + (data.u.length - data.l.length) + " more";
					}

					html += Funny_Post.SETTINGS.laughed_at;

					$elem.html(html);

					$info.append($elem);
				}
			}
		}
	}, {
		key: "show_in_mini_profile",
		value: function show_in_mini_profile($mini_profile, post_created_by) {
			var $elem = $mini_profile.find(".funny-posts-count");
			var $info = $mini_profile.find(".info");

			if (!$elem.length && !$info.length) {
				console.warn("Funny Post: No info element found.");

				return;
			}

			var using_info = false;

			if ($elem.length) {
				this.using_custom = true;
			} else {
				using_info = true;
				$elem = $("<div class='funny-post-count'></div>");
			}

			var count = yootil.key.value(Funny_Post.PLUGIN_USER_KEY, post_created_by) || 0;
			var html = "<span class='funny-post-count'>" + Funny_Post.SETTINGS.mini_profile + "<span>" + count + "</span></span><br />";

			$elem.html(html);

			if (using_info) {
				$info.prepend($elem);
			}

			$elem.show();
		}
	}, {
		key: "increment_user_count",
		value: function increment_user_count(user_id) {
			var current = parseInt(yootil.key.value(Funny_Post.PLUGIN_USER_KEY, user_id), 10) || 0;

			yootil.key.set(Funny_Post.PLUGIN_USER_KEY, current + 1, user_id);
		}
	}, {
		key: "decrement_user_count",
		value: function decrement_user_count(user_id) {
			var current = parseInt(yootil.key.value(Funny_Post.PLUGIN_USER_KEY, user_id), 10) || 0;

			if (current > 0) {
				yootil.key.set(Funny_Post.PLUGIN_USER_KEY, current - 1, user_id);
			}
		}
	}]);

	return Funny_Post;
}();

var Funny_Post_Data = function () {
	function Funny_Post_Data() {
		var post_id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
		var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		_classCallCheck(this, Funny_Post_Data);

		this._post_id = parseInt(post_id, 10) || 0;
		this._data = Object.assign(Object.create(null), {

			u: data && data.u && Array.isArray(data.u) ? data.u : [],
			l: data && data.u && Array.isArray(data.l) ? data.l : []

		});
	}

	_createClass(Funny_Post_Data, [{
		key: "contains",
		value: function contains(user_id) {
			if ($.inArrayLoose(user_id, this._data.u) > -1) {
				return true;
			}

			return false;
		}
	}, {
		key: "add",
		value: function add(user_id, name) {
			if (this._data.l.length > 5) {
				this._data.l.pop();
			}

			this._data.l.unshift({

				u: user_id,
				n: name

			});

			this._data.u.push(user_id);

			yootil.key.set(Funny_Post.PLUGIN_POST_KEY, this._data, this._post_id);
		}
	}, {
		key: "remove",
		value: function remove(user_id) {
			var idx = -1;

			for (var i = 0; i < this._data.l.length; ++i) {
				if (this._data.l[i].u == user_id) {
					idx = i;
					break;
				}
			}

			if (idx > -1) {
				this._data.l.splice(idx, 1);
			}

			var idx2 = $.inArrayLoose(user_id, this._data.u);

			if (idx2 > -1) {
				this._data.u.splice(idx2, 1);
			}

			yootil.key.set(Funny_Post.PLUGIN_POST_KEY, this._data, this._post_id);
		}
	}, {
		key: "post_id",
		get: function get() {
			return this._post_id;
		}
	}, {
		key: "data",
		get: function get() {
			return this._data;
		}
	}]);

	return Funny_Post_Data;
}();


Funny_Post.init();