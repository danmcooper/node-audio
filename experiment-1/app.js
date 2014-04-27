var fs = require('fs');

var sinX1, sinX2, sinX4;
var sinX1LR, sinX2LR, sinX4LR;
var sinX1Offset = 0, sinX2Offset = 0, sinX4Offset = 0;

// parameters
var startFreq = 30;
var endFreq = 200;
var sinX1BaseLRFreq = 0.3;
var sinX2BaseLRFreq = .8;
var sinX4BaseLRFreq = 1.4;
var allSounds = [];
var filename = "sound.wav";
var samplesPerSecond = 44100;
var maxAmplitude = 1048575; // 20bits - 1 equiv
var durationForFreq = 100;

var toBuffer = function(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}

var createSin = function(freq, durationMs, offset) {
    var samples = [];
    var numSamples = samplesPerSecond * durationMs / 1000;
    var sinValue;
    for(var i = 0; i < numSamples; i++) {
        sinValue = 2 * Math.PI * freq  * i / samplesPerSecond + offset;
        samples.push(Math.round(maxAmplitude * Math.sin(sinValue)));
    }

    return samples;
}

var addLR = function(samples, rotateFreq) {
    // take mono samples, return stereo with l-r mix of about rotateFreq
    rotateFreq = rotateFreq + ((Math.random() - 0.5) * rotateFreq /3);
    var lr = [], l = [], r = [];
    var left, right;
    for (var i = 0; i < samples.length; i++) {
        right = (Math.sin(2 * Math.PI * i * rotateFreq / samplesPerSecond) + 1)/2;
        left = (Math.cos(2 * Math.PI * i * rotateFreq / samplesPerSecond) + 1)/2;
        l.push(samples[i] * left);
        r.push(samples[i] * right);
    }

    lr.push(l);
    lr.push(r);

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
            interleaveArray.push(sounds[i][0][j]/16);
            interleaveArray.push(sounds[i][1][j]/16);
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
            view.setInt16(index, interleaved[i] & (0x7FFF), true);
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
for(var i = startFreq, duration = durationForFreq; i < endFreq; i++) {
    sinX1 = createSin(i, duration, sinX1Offset);
    sinX1Offset = Math.asin(sinX1[sinX1.length - 1]/maxAmplitude);
    sinX2 = createSin(i*2, duration, sinX2Offset);
    sinX2Offset = Math.asin(sinX2[sinX2.length - 1]/maxAmplitude);    
    sinX4 = createSin(i*4, duration, sinX4Offset);
    sinX4Offset = Math.asin(sinX4[sinX4.length - 1]/maxAmplitude);    
    sinX1LR = addLR(sinX1, sinX1BaseLRFreq);
    sinX2LR = addLR(sinX2, sinX2BaseLRFreq);
    sinX4LR = addLR(sinX4, sinX4BaseLRFreq);
    var mix = addSounds(sinX1LR, sinX2LR, sinX4LR);
    allSounds.push(mix);
}


writeFile(allSounds, filename);