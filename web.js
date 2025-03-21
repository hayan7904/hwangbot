var express = require('express');
var packageInfo = require('./package.json');

var app = express();

app.get('/', function (req, res) {
    res.json({ version: packageInfo.version });
});

var server = app.listen(process.env.PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Web server started at http://%s:%s', host, port);
    // console.log(' ___  ___  ___       __   ________  ________   ________                 ________  ________  _________        ________  ________ _________  ___  ___      ___ ________  _________  _______   ________      ');
    // console.log('|\\  \\|\\  \\|\\  \\     |\\  \\|\\   __  \\|\\   ___  \\|\\   ____\\               |\\   __  \\|\\   __  \\|\\___   ___\\     |\\   __  \\|\\   ____\\\\___   ___\\\\  \\|\\  \\    /  /|\\   __  \\|\\___   ___\\\\  ___ \\ |\\   ___ \\     ');
    // console.log('\\ \\  \\\\\\  \\ \\  \\    \\ \\  \\ \\  \\|\\  \\ \\  \\\\ \\  \\ \\  \\___|   ____________\\ \\  \\|\\ /\\ \\  \\|\\  \\|___ \\  \\_|     \\ \\  \\|\\  \\ \\  \\___\\|___ \\  \\_\\ \\  \\ \\  \\  /  / | \\  \\|\\  \\|___ \\  \\_\\ \\   __/|\\ \\  \\_|\\ \\    ');
    // console.log(' \\ \\   __  \\ \\  \\  __\\ \\  \\ \\   __  \\ \\  \\\\ \\  \\ \\  \\  ___|\\____________\\ \\   __  \\ \\  \\\\\\  \\   \\ \\  \\       \\ \\   __  \\ \\  \\       \\ \\  \\ \\ \\  \\ \\  \\/  / / \\ \\   __  \\   \\ \\  \\ \\ \\  \\_|/_\\ \\  \\ \\\\ \\   ');
    // console.log('  \\ \\  \\ \\  \\ \\  \\|\\__\\_\\  \\ \\  \\ \\  \\ \\  \\\\ \\  \\ \\  \\|\\  \\|____________|\\ \\  \\|\\  \\ \\  \\\\\\  \\   \\ \\  \\       \\ \\  \\ \\  \\ \\  \\____   \\ \\  \\ \\ \\  \\ \\    / /   \\ \\  \\ \\  \\   \\ \\  \\ \\ \\  \\_|\\ \\ \\  \\_\\\\ \\  ');
    // console.log('   \\ \\__\\ \\__\\ \\____________\\ \\__\\ \\__\\ \\__\\\\ \\__\\ \\_______\\              \\ \\_______\\ \\_______\\   \\ \\__\\       \\ \\__\\ \\__\\ \\_______\\  \\ \\__\\ \\ \\__\\ \\__/ /     \\ \\__\\ \\__\\   \\ \\__\\ \\ \\_______\\ \\_______\\ ');
    // console.log('    \\|__|\\|__|\\|____________|\\|__|\\|__|\\|__| \\|__|\\|_______|               \\|_______|\\|_______|    \\|__|        \\|__|\\|__|\\|_______|   \\|__|  \\|__|\\|__|/       \\|__|\\|__|    \\|__|  \\|_______|\\|_______| ');
    // console.log('');
});