var fs = require('fs');

var sinX1, sinX2, sinX4;
var sinX1LR, sinX2LR, sinX4LR;
var sinX1Offset = Math.PI/4, sinX2Offset = Math.PI/4, sinX4Offset = Math.PI/4;
var sinX1LROffset = 0, sinX2LROffset = 0, sinX4LROffset = 0;
var voices = [];

// parameters
var startFreq = 50;
var endFreq = 120;
var numSteps = 800;
var sinX1BaseLRFreq = .06;
var sinX2BaseLRFreq = .065;
var sinX4BaseLRFreq = .07;
var allSounds = [];
var filename = "what is going on.wav";
var samplesPerSecond = 44100;
var maxAmplitude = 1048575; // 20bits - 1 equiv
var durationForFreq = 100;

var voice1 = function(rad) {
    return (Math.sin(rad) + 0.33 * Math.sin(rad * 3) + 0.11 * Math.sin(rad * 5))/1.44;
}

var voice2 = function(rad) {
    return (Math.sin(rad) + 0.33 * Math.sin(rad * 2) + 0.11 * Math.sin(rad * 4))/1.44;
}

var voice3 = function(rad) {
    return (Math.sin(rad) + 0.33 * Math.sin(rad * 2) + 0.11 * Math.sin(rad * 3))/1.44;
}

var toBuffer = function(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}

var createSin = function(freq, durationMs, offset, voice) {
    var samples = [];
    var numSamples = samplesPerSecond * durationMs / 1000;
    var sinValue;
    for(var i = 0; i < numSamples; i++) {
        sinValue = 2 * Math.PI * freq  * i / samplesPerSecond + offset;
        // samples.push(Math.round(maxAmplitude * Math.sin(sinValue)));        
        samples.push(Math.round(maxAmplitude * voice(sinValue)));
    }

    return [samples, sinValue];
}

var addLR = function(samples, rotateFreq, offset) {
    // take mono samples, return stereo with l-r mix of about rotateFreq
    rotateFreq = rotateFreq + ((Math.random() - 0.5) * rotateFreq /1.5);
    var lr = [], l = [], r = [];
    var leftRaw, left, right;
    for (var i = 0; i < samples.length; i++) {
        leftRaw = Math.sin(offset + 2 * Math.PI * i * rotateFreq / samplesPerSecond);
        left = (leftRaw + 1)/2;
        right = 1 - left;
        l.push(samples[i] * left);
        r.push(samples[i] * right);
    }

    lr.push(l);
    lr.push(r);
    lr.push(offset + 2 * Math.PI * (samples.length - 1) * rotateFreq / samplesPerSecond);

    return lr;
}

var addSounds = function(x1, x2, x4) {
    var len = x1[0].length;
    var lr = [], l = [], r = [];

    for (var i = 0; i < len; i++) {
        l.push(x1[0][i]/3 + x2[0][i]/3 + x4[0][i]/3);
        r.push(x1[1][i]/3 + x2[1][i]/3 + x4[1][i]/3);        
    }

    lr.push(l);
    lr.push(r);

    return lr;
}

var writeFile = function(sounds, filename) {
    var interleave = interleaveSounds(sounds);

    writeWAV(interleave, filename);
}

var interleaveSounds = function(sounds) {
    // this is where it goes from js numbers to an interleaved byte array
    // 
    var len = sounds.length;

    var interleaveArray = [];
    for(var i = 0; i < len; i++) {
        for(var j =0; j < sounds[i][0].length; j++) {
            //console.log(Math.round(sounds[i][0][j]/16));
            interleaveArray.push(Math.round(sounds[i][0][j]/32));
            interleaveArray.push(Math.round(sounds[i][1][j]/32));
        }
    }

    return interleaveArray;
}

var writeUTFBytes = function(view, offset, string) { 
  var lng = string.length;
  for (var i = 0; i < lng; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

var writeWAV = function(interleaved, filename) {
    var stream = fs.createWriteStream(filename);
    stream.on('open', function(fd) {
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, 2, true);
        view.setUint32(24, 44100, true);
        view.setUint32(28, 44100 * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        var lng = interleaved.length;
        var index = 44;

        for (var i = 0; i < lng; i++){
            view.setInt16(index, interleaved[i], true);
            index += 2;
            //console.log(interleaved[i] & (0x7FFF));
        }

        stream.write(toBuffer(buffer));
        stream.end();
    });

}

// do slow ascent from 30 to 120
// add in harmonics
// update left to right freq
// save file
var stepSize = (endFreq - startFreq)/numSteps;
for(var i = startFreq, duration = durationForFreq; i < endFreq;) {
    // var upOrDown = Math.floor(Math.random()*3);
    // if (upOrDown) {
        i+=stepSize;
    // } else {
        // i-=stepSize;
    // }
    sinX1 = createSin(i, duration, sinX1Offset, voice1);
    sinX1Offset = sinX1[1];
    sinX1 = sinX1[0];
    sinX2 = createSin(i*2, duration, sinX2Offset, voice2);
    sinX2Offset = sinX2[1];
    sinX2 = sinX2[0];  
    sinX4 = createSin(i*4, duration, sinX4Offset, voice3);
    sinX4Offset = sinX4[1];
    sinX4 = sinX4[0];

    sinX1LR = addLR(sinX1, sinX1BaseLRFreq, sinX1LROffset);
    sinX1LROffset = sinX1LR[2];
    //console.log(sinX1LROffset);
    sinX2LR = addLR(sinX2, sinX2BaseLRFreq, sinX2LROffset);
    sinX2LROffset = sinX2LR[2];    
    sinX4LR = addLR(sinX4, sinX4BaseLRFreq, sinX4LROffset);
    sinX4LROffset = sinX4LR[2];    
    var mix = addSounds(sinX1LR, sinX2LR, sinX4LR);
    allSounds.push(mix);
}


writeFile(allSounds, filename);