var page_mod = require("sdk/page-mod"),
	panel = require("sdk/panel"),
	passwords = require("sdk/passwords"),
	prefs = require("sdk/preferences/service"),
	tabs = require("sdk/tabs"),
	ui = require('sdk/ui'),
	unload = require("sdk/system/unload");

function modify_pref(name, value) {
	initial_prefs[name] = prefs.get(name);
	prefs.set(name, value);
}
function addon_unload() {
	for (var prop in initial_prefs) {
		prefs.set(prop, initial_prefs[prop]);
	}
}

function init() {
	// Listeners
	content_script.on("attach", content_script_on_attach);
	addon_panel.on("hide", addon_panel_on_hide);
	addon_button.on("change", addon_button_on_change);

	addon_panel.port.on("login", function(credential) {
		var worker_obj = worker_objs[tabs.activeTab.url];
		worker_obj.worker.port.emit("login", credential);
	});
}

// init
var initial_prefs = {},
	worker_objs = {},
	content_script;

var addon_panel = panel.Panel({
		width: 150,
		height: 180,
		contentURL: "./panel/panel.html",
		contentScriptFile: "./panel/panel.js",
	}),
	addon_button = ui.ToggleButton({
		id: "login-wand",
		label: "Login Wand",
		icon: {
			"16": "./icon-16.png",
		},
		badge: null,
	});

unload.when(addon_unload);

modify_pref("signon.autofillForms", false);

passwords.search({
	onComplete: function(credentials) {
		var password_urls = [];
		for(let credential of credentials) {
			password_urls.push(credential.url + "/*")
		}

		content_script = page_mod.PageMod({
			include: password_urls,
			contentScriptFile: "./login.js",
			contentScriptWhen: "ready",
			attachTo: "top",
		});

		init();
	}
});


function content_script_on_attach(worker) {
	var credentials_tmp,
		listener_modified = false;

	var listener_tmp = function(state) {
		if (state.checked) {
			addon_panel.port.emit("forcelogin", credentials_tmp[0]);
			addon_button.click();
		}
	}

	worker_objs[worker.url] = {
		worker: worker,
	};

	worker.port.on("loaded", function(url) {
		passwords.search({
			url: url,
			onComplete: function(credentials) {
				credentials_tmp = credentials;

				if (credentials.length) {
					worker.port.emit("validate", credentials[0]);
				}
			}
		});
	});

	worker.port.on("unloaded", function() {
		addon_button.state(worker.tab, {
			"badge": null
		});
		addon_panel.hide();
		addon_panel.port.emit("unload");

		if (listener_modified) {
			addon_button.removeListener("change", listener_tmp);
			addon_button.on("change", addon_button_on_change);
		}
		delete worker_objs[worker.url];
	});

	worker.port.on("validated", function() {
		addon_button.state(worker.tab, {
			"badge": credentials_tmp.length,
		});
		if (credentials_tmp.length < 2) {
			addon_button.removeListener("change", addon_button_on_change);
			addon_button.on("change", listener_tmp);
			listener_modified = true;
		} else {
			addon_panel.port.emit("load", credentials_tmp);
		}
		worker_objs[worker.url].credentials = credentials_tmp;
	});
}

function addon_button_on_change(state) {
	if (state.checked) {
		addon_panel.show({
			position: addon_button
		});
	}
}
function addon_panel_on_hide() {
	addon_button.state("window", {
		checked: false
	});
}