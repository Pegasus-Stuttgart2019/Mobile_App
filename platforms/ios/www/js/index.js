var app = {
    initialize: function() {
        console.error = window.onerror = function() {
            if (JSON.stringify(arguments).indexOf('iosrtc') !== -1) {
                return;
            }

            if (JSON.stringify(arguments).indexOf('No Content-Security-Policy') !== -1) {
                return;
            }

            if (JSON.stringify(arguments).indexOf('<') !== -1) {
                return;
            }
            alert(JSON.stringify(arguments, null, ' '));
        };
        app.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
        document.addEventListener('resume', function() {
            if (window.connection && connection.getAllParticipants().length) {
                return;
            }
            location.reload();
        }, false);

        document.addEventListener('online', function() {
            location.reload();
        }, false);

        document.addEventListener('offline', function() {
            alert('Seems disconnected.');
        }, false);
    },

    onDeviceReady: function() {

        // initializing the constructor
        var connection = new RTCMultiConnection();
        var room_name = 'Bildregie';

        // comment-out below line if you do not have your own socket.io server
        // connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

        // hier muss man noch mit Regex den Text nach dem letzten Slash rausschmeißen
        //"http://192.168.10.23:9001/artwork/data.txt" -->  http://192.168.10.23:9001/		
        var setting_address = localStorage.getItem('address');
        connection.socketURL = setting_address.match(/[a-zA-Z0-9_:./]*\d\/(?=[a-zA-Z])/g)[0];
        //alert(connection.socketURL);
        //connection.socketURL = 'http://192.168.10.23:9001/';

        connection.socketMessageEvent = 'audio-conference-demo';

        // setting type of media connection
        connection.session = {
            audio: true
        };

        connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: false
        };

        connection.mediaConstraints = {
            audio: true,
            video: false
        };

        var audiosContainer = document.getElementById('audios-container');
        connection.onstream = function(e) {
            e.mediaElement.id = e.streamid;
            audiosContainer.appendChild(e.mediaElement);
        };

        // if user left
        connection.onleave = function(e) {
            var audio = document.getElementById(e.userid);


            if (audio && audio.parentNode) {
                audio.parentNode.parentNode.removeChild(audio);
            }
        };

        connection.processSdp = function(sdp) {
            return sdp;
        };

        connection.onMediaError = function(error, constraints) {
            navigator.notification.alert(error.toString() + '\n\nPlease make sure to enable microphone permissions.', null, 'Unable to Capture Mic', 'OK');
        };

        connection.sessionid = room_name;

        navigator.notification.prompt('Please enter unique room-id:', function(results) {

            if (!results.input1 || !results.input1.length) {
                connection.sessionid = connection.userid;

                navigator.notification.alert('Your room-id is: ' + connection.sessionid, null, 'Random Room-ID', 'OK');
            }

            connection.sessionid = results.input1;
            connection.openOrJoin(connection.sessionid, function() {
                localStorage.setItem('room-id', connection.sessionid);
            });
        }, 'Join A Room', ['Join Room'], connection.sessionid);

        //funktioniert, aber er bringt beim Start der App einen Fehler
        //connection.changeUserId('alfonso');


        //** PUSH TO TALK FUNCTION
        //Mute or Unmute local Microphone, so it's not all the time send to the other people in the room
        // ACHTUNG: Bei IOs ist wsl der Filepfad dann ein anderer
        document.querySelector('#mute-switch').onclick = function() {

            if (connection && connection.attachStreams) {
                try {
                    if (document.getElementById('mute-switch').src == "file:///android_asset/www/mic_loud.png") {
                        //alert("mute");
                        document.getElementById('mute-switch').src = "mic_mute.png";
                        connection.attachStreams.forEach(function(stream) {
                            stream.mute();
                        });
                    } else {
                        //alert("loud");
                        document.getElementById('mute-switch').src = "mic_loud.png";
                        connection.attachStreams.forEach(function(stream) {
                            stream.unmute();
                        });
                    }
                } catch (e) {}
            }
        };
    }
};

function start_conference() {
    //Disable Input Button	
    document.getElementById('open-or-join').disabled = true;
    //Aufbau Audio Conference Session
    app.initialize();
}