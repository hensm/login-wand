function get_parent_by_tag(element, tag) {
	var parentNode = element.parentNode;
	while(parentNode) {
		if(parentNode.tagName === tag.toUpperCase()) {
			return parentNode;
		}
		parentNode = parentNode.parentNode;
	}
}

self.port.emit("loaded", window.location.origin);
self.port.on("validate", function(credential) {
	var userField = document.getElementsByName(credential.usernameField)[0];
	var passField = document.getElementsByName(credential.passwordField)[0];
	if (document.getElementsByName(credential.usernameField).length &&
		document.getElementsByName(credential.passwordField).length) {
		self.port.emit("validated");
	}
});
self.port.on("login", function(credential) {
	var userField = document.getElementsByName(credential.usernameField)[0];
	var passField = document.getElementsByName(credential.passwordField)[0];

	userField.value = credential.username;
	passField.value = credential.password;

	var form = get_parent_by_tag(userField, "form");
	var submit = form.querySelector("[type=\"submit\"]");

	if (submit) {
		submit.click();
	} else {

		if (form.onsubmit) {
			form.onsubmit();
		} else {
			form.submit();
		}
	}
});

window.addEventListener("beforeunload", function() {
	self.port.emit("unloaded");
});