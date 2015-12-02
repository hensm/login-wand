var identities = document.getElementById("identities");

function reset_content() {
	identities.innerHTML = "";
}

function on_load(credentials) {
	for(var credential of credentials) {
		var list_item = document.createElement("li"),
			list_item_user = document.createElement("span"),
			list_item_pass = document.createElement("span");

		list_item_user.classList.add("user");
		list_item_pass.classList.add("pass");

		list_item_user.appendChild(document.createTextNode(credential.username));
		list_item_pass.appendChild(document.createTextNode(Array(credential.password.length).join("●")));
		list_item.appendChild(list_item_user);
		list_item.appendChild(list_item_pass);

		identities.appendChild(list_item);

		(function(credential) {
			list_item.addEventListener("click", function() {
				self.port.emit("login", credential);
			}, false);
		})(credential);
	}
}

function on_unload() {
	reset_content();
}

self.port.on("load", on_load);
self.port.on("unload", on_unload);

self.port.on("forcelogin", function(credential) {
	self.port.emit("login", credential);
});