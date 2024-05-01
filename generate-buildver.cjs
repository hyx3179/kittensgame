const fs = require("fs");
var publicFile = "./public/build.version.json";

Promise.all([
  fetch("https://kittensgame.com/web/build.version.json"),
  fetch(`https://${process.env.DEPLOY_URL}/build.version.json`),
])
  .then(([gamebuild, build]) => Promise.all([gamebuild.json(), build.json()]))
  .then(([gamebuild, build]) => {
    if (gamebuild.buildRevision > build.buildRevision / 100) {
      var metadata = { buildRevision: gamebuild.buildRevision * 100 + 1 };
    } else {
      var metadata = { buildRevision: build.buildRevision + 1 };
    }
    console.log(
      `Game build number: ${Math.floor(metadata.buildRevision / 100)}`
    );
    console.log(`Current build number: ${metadata.buildRevision % 100}`);

    fs.writeFile(publicFile, JSON.stringify(metadata), (err) => {
      if (err) throw err;
    });
  });
