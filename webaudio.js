
// WebAudioAPISoundManager Constructor
let WebAudioAPISoundManager = function (context) {
  this.context = context;
  this.bufferList = {};
  console.log( "WebAudioAPISoundManager v0.0.1")
};

// WebAudioAPISoundManager Prototype
WebAudioAPISoundManager.prototype = {
  addSound: function( url, sound ) {
    // Load buffer asynchronously
    let request = new XMLHttpRequest();
    request.open( "GET", encodeURI( url ), true );
    request.responseType = "arraybuffer";
    request.onload = () => {
      this.context.decodeAudioData( request.response ).then(
        (buffer) => {
          if (!buffer) { console.log('error decoding file data: ' + url); return; }
          this.bufferList[url] = buffer;
        },
        (err) => sound.onerror && sound.onerror()
      );
    };
    request.onerror = function () {
      sound.onerror && sound.onerror();
      console.log('BufferLoader: XHR error');
    };
    request.send();
  },
  bufferList: {}  // indexed by url
};


// WebAudioAPISound Constructor (compatible with Audio)
// usage:
//   smashSound = new WebAudioAPISound("smash.mp3");
//   backgroundMusic = new WebAudioAPISound("smooth-jazz.mp3", {loop: true});
var WebAudioAPISound = function (url, options) {
   this.settings = Object.assign( { loop: false }, options );
   this.url = url;
   window.webAudioAPISoundManager = window.webAudioAPISoundManager || new WebAudioAPISoundManager(window.audioContext);
   this.manager = window.webAudioAPISoundManager;
   this.manager.addSound(this.url, this);
};

// WebAudioAPISound Prototype
WebAudioAPISound.prototype = {
  set src( url ) { this.url = url },
  get src() { return this.url },
  load() { this.manager.addSound( this.url, this ) },
  play() {
     console.log( "playing " + this.url );
    var buffer = this.manager.bufferList[this.url];
    //Only play if it's loaded yet
    if (typeof buffer !== "undefined") {
      this.source = this.makeSource(buffer);
      this.source.loop = this.settings.loop;
      this.source.start(0);
    }
  },
  stop() { this.source.stop() },
  getVolume() { this.translateVolume(this.volume, true) },
  setVolume( volume /* 0-100 */ ) { this.volume = this.translateVolume( volume ) },
  translateVolume( volume, inverse ) { inverse ? volume * 100 : volume / 100 },
  makeSource: function (buffer) {
    var source = this.manager.context.createBufferSource();
    var gainNode = this.manager.context.createGain();
    gainNode.gain.setTargetAtTime( this.volume ? this.volume : 0.5, this.manager.context.currentTime + 1, 0.5 );
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.manager.context.destination);
    return source;
  },
  onerror() { console.log( "no error registered for: " + this.url ) }
};

// replace Audio system with WebAudioAPISound, if supported
try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  window.audioContext = new window.AudioContext();
  Audio = WebAudioAPISound;
  console.log( "WebAudio Initialized - Replaced your Audio with WebAudioAPISound!")
} catch (e) {
  console.log( "No Web Audio API support" );
}

