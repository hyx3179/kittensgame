var fs = require("fs");
var buildFile = "build.version.json"
var publicFile = "./public/build.version.json"

console.log("Incrementing build number...");
var buildRevision = fs.readFileSync(buildFile)
metadata = JSON.parse(buildRevision);

try {
	var swRevision = fs.readFileSync(publicFile)
	swRevision = JSON.parse(swRevision).swRevision;
} catch (err) {
	swRevision = 0
}
swRevision = swRevision ? swRevision : 0

metadata.swRevision = swRevision + 1;
fs.writeFile(publicFile, JSON.stringify(metadata), err => { if (err) throw err; })
console.log(`Current build number: ${metadata.swRevision}`);

var str = "(function () {const swRevision = " + metadata.swRevision
fs.writeFile("sw-public.js", str, err => { if (err) throw err; })