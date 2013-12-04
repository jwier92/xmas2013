var fs = require('fs')
    , http = require('http')
    , socketio = require('socket.io')
    , serial = require('serialport');

var sys = require('sys');
var exec = require('child_process').exec;

var xbeePort = '/dev/ttyUSB0';

var xbee = new serial.SerialPort(xbeePort, { baudrate: 9600, parser: serial.parsers.readline('\r\n') });

var server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html'));
}).listen(80, function() {
    console.log('Listening at http://localhost:8080');
});


socketio.listen(server).on('connection', function(socket) {
    console.log("client connected");    
    
    function refreshClients() {
        xbee.write('z'); // this will send a z to the ardiuno returning the bits to the xbee.on data listener
        
        // 0 
        var child = exec("/usr/local/bin/gpio read 0", function(error, stdout, stderr) {
            var rData = { };
            if (error != null) console.log("Exec error: " + error);
            if (stdout.substring(0,1) == "0") rData.pa0 = "on"
            else rData.pa0 = "off"
            socket.emit('message', JSON.stringify(rData));
        });

        // 1
        var child = exec("/usr/local/bin/gpio read 1", function(error, stdout, stderr) {
            var rData = { };
            if (error != null) console.log("Exec error: " + error);
            if (stdout.substring(0,1) == "0") rData.pa1 = "on"
            else rData.pa1 = "off"
            socket.emit('message', JSON.stringify(rData));
        });

        // 2
        var child = exec("/usr/local/bin/gpio read 2", function(error, stdout, stderr) {
            var rData = { };
            if (error != null) console.log("Exec error: " + error);
            if (stdout.substring(0,1) == "0") rData.pa2 = "on"
            else rData.pa2 = "off"
            socket.emit('message', JSON.stringify(rData));
        });

        // 3
        var child = exec("/usr/local/bin/gpio read 3", function(error, stdout, stderr) {
            var rData = { };
            if (error != null) console.log("Exec error: " + error);
            if (stdout.substring(0,1) == "0") rData.pa3 = "on"
            else rData.pa3 = "off"
            socket.emit('message', JSON.stringify(rData));
        });

        // 4
        var child = exec("/usr/local/bin/gpio read 4", function(error, stdout, stderr) {
            var rData = { };
            if (error != null) console.log("Exec error: " + error);
            if (stdout.substring(0,1) == "0") rData.pa4 = "on"
            else rData.pa4 = "off"
            socket.emit('message', JSON.stringify(rData));
        });
        
        // 5
        var child = exec("/usr/local/bin/gpio read 5", function(error, stdout, stderr) {
            var rData = { };
            if (error != null) console.log("Exec error: " + error);
            if (stdout.substring(0,1) == "0") rData.pa5 = "on"
            else rData.pa5 = "off"
            socket.emit('message', JSON.stringify(rData));
        });
    }

    // XBee Info and client update
    xbee.on('data', function(data) {
        var returnData = { };

        returnData.pb0 = data.substring(0,1) == '0' ? "on" : "off";
        returnData.pb1 = data.substring(1,2) == '0' ? "on" : "off";
        returnData.pb2 = data.substring(2,3) == '0' ? "on" : "off";
        returnData.pb3 = data.substring(3,4) == '0' ? "on" : "off";
        socket.emit('message', JSON.stringify(returnData));
        console.log("Received Serial Data: " + data);
    });
    socket.on('message', function(msg) {
        console.log('Message Received: ' + msg);

        if (msg == 'z') {
            // got a z, we need to return the status
            refreshClients();
        }
        else {        
            // msg will have two parts light and on/off
            // pa0 on would turn on RPi port 0 to ON
            // Need to split the message
            var parts = msg.split(" ");
            var command = parts[0];
            var state = parts[1];
            var acommand = "";
            console.log("Command dot substring 1,2 is: " + command.substring(1,2));
            if (command.substring(1,2) == "b") { // b is xbee to arduino
                if (state == "on") {
                    switch(command.substring(2,3)) {
                        case '0': acommand = 'p'; break;    
                        case '1': acommand = 'q'; break;    
                        case '2': acommand = 'r'; break;    
                        case '3': acommand = 's'; break;    
                    }
                }
                else {
                    switch(command.substring(2,3)) {
                        case '0': acommand = '9'; break;    
                        case '1': acommand = 'a'; break;    
                        case '2': acommand = 'b'; break;    
                        case '3': acommand = 'c'; break;    
                    }
                }
                console.log("Command dot substring 2,3 is: " + command.substring(2,3));
                console.log('This is an xbee message: ' + acommand);
                xbee.write(acommand);
                xbee.write('z'); // this will send a z to the ardiuno returning the bits to the xbee.on data listener
            }
            else { // This is an RPi command or a "pax on"
                var astate = "";
                var aport = 0;
                if (state == "on") astate = "0";
                else astate = "1";

                // map the ports
                console.log("Command dot substring 2,3 is: " + command.substring(2,3));
                switch(command.substring(2,3)) {
                    case '0': aport = "0"; break;
                    case '1': aport = "1"; break;
                    case '2': aport = "2"; break;
                    case '3': aport = "3"; break;
                    case '4': aport = "4"; break;
                    case '5': aport = "5"; break;
                }

                var acommand = "/usr/local/bin/gpio write " + aport + " " + astate

                var child = exec(acommand, function(error, stdout, stderr) {
                    if (error != null) console.log("Exec error: " + error);
                    var rData = { };
                    rData[command] = state;
                    socket.emit('message', JSON.stringify(rData));
                });
                console.log('exec command: ' + acommand);
            }
        }
    });

    var ClientRefresh = setInterval(refreshClients, 15000);
    
    socket.on('disconnect', function() {
        console.log("client disconnected");    
    });
});


