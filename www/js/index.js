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
            //Deactivate Error Messages for productive usage. But for debugging useful! 
            // alert(JSON.stringify(arguments, null, ' '));
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
            // alert('Seems disconnected.');
            document.getElementById('myStatus').innerHTML = "<i class='fa fa-refresh fa-spin fa-1.5x fa-fw' ></i>" + "&#160 &#160Offline!";
            document.getElementById('myStatus').style.display = "block";
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
            // VoiceActivityDetection: false,
            OfferToReceiveVideo: false
        };

        var audioConstraints = {
            mandatory: {
                //echoCancellation: true,
                // googEchoCancellation: true, // disabling audio processing
                googAutoGainControl: true,
                googNoiseSuppression: true,
                //     googHighpassFilter: true,
                googTypingNoiseDetection: true
                    //   googAudioMirroring: true
            },
            optional: []
        };

        connection.mediaConstraints = {
            //audio: true,
            audio: audioConstraints,
            video: false
        };

        var audiosContainer = document.getElementById('audios-container');
        connection.onstream = function(e) {
            e.mediaElement.id = e.streamid;
            audiosContainer.appendChild(e.mediaElement);
        };

        //**********************************************************************
        //		Error- & Status-Handling
        //**********************************************************************

        //++ If user left
        connection.onleave = function(e) {
            var audio = document.getElementById(e.userid);

            if (audio && audio.parentNode) {
                audio.parentNode.parentNode.removeChild(audio);
            }

            if (e.userid == room_name) {
                //alert('Room Host has left. Close connection');
                // Reload, so connection gets closed and wait for Admin to host new connection
                location.reload();
            }
        };

        connection.processSdp = function(sdp) {
            return sdp;
        };

        connection.onMediaError = function(error, constraints) {
            navigator.notification.alert(error.toString() + '\n\nPlease make sure to enable microphone permissions.', null, 'Unable to Capture Mic', 'OK');
        };

        //**********************************************************************
        //		Room Handling
        // TO DO:         //Change User ID funktioniert, aber er bringt beim Start der App einen Fehler
        //                  connection.changeUserId('alfonso');
		//					und das "connection.userid = myString.substr(7);" vom Rechner funzt hier nicht
		//					er baut dann keine saubere Verbindung auf
        //**********************************************************************
        connection.sessionid = room_name;

        // Auto-join-room
        (function reCheckRoomPresence() {
            connection.checkPresence(room_name, function(isRoomExists, room_name) {
                if (isRoomExists) {

					//User ID auf den Namen des jeweiligen Kameramanns setzen, funktioniert nicht. Er verbindet nicht sauber
					//var myString = document.getElementById('heading').innerHTML;
					//connection.userid = myString.substr(7);
					
					//Join Room
					connection.join(room_name);
												
                    //Hide Status Bar
                    document.getElementById('myStatus').style.display = "none";
                    setTimeout(mute_mic, 5000);
										
                    return;
                }
                setTimeout(reCheckRoomPresence, 5000);
            });
        })();

        //++ PUSH TO TALK FUNCTION
        // Mute or Unmute local Microphone, so it's not all the time send to the other people in the room
        // ACHTUNG: Bei IOs ist wsl der Filepfad dann ein anderer
        function mute_mic() {
			//Mute own Microphone
            if (connection && connection.attachStreams) {
                try {
                    document.getElementById('mute-switch').checked = 0;
                    connection.attachStreams.forEach(function(stream) {
                        stream.mute();
                    });
                } catch (e) {}
            }
        }

        document.querySelector('#mute-switch').onclick = function() {
            if (connection && connection.attachStreams) {
                try {
                    if (document.getElementById('mute-switch').checked == 0) {
                        // alert("mute");
                        connection.attachStreams.forEach(function(stream) {
                            stream.mute();
                        });
                    } else {
                        // alert("loud");			
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
    //alert("Start Audio Conference Session");
    app.initialize();
}