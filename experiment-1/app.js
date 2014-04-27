var fs = require('fs');

var sinX1, sinX2, sinX4;
var sinX1LR, sinX2LR, sinX4LR;

// parameters
var startFreq = 30;
var endFreq = 120;
var sinX1BaseLR_freq = 1.0;
var sinX2BaseLR_freq = .7;
var sinX4BaseLR_freq = 1.1;
var allSounds = [];
var filename = "sound.wav";
var samplesPerSecond = 44100;
var maxAmplitude = 1048575; // 20bits - 1 equiv
var durationForFreq = 500;

var createSin = function(freq, durationMs) {
    var samples = [];
    var numSamples = samplesPerSecond * durationMs / 1000;
    var sinValue;
    for(var i = 0; i < numSamples; i++) {
        sinValue = 2 * Math.PI * freq  * i / samplesPerSecond;
        samples[i] = Math.round(maxAmplitude * Math.sin(sinValue));
    }
}

var addLR = function(samples, rotateFreq) {
    // take mono samples, return stereo with l-r mix of about rotateFreq
    rotateFreq = rotateFreq + ((Math.random() - 0.5) * rotateFreq /10);
    l = [], r = [];
    var left, right;
    for (var i = 0; i < samples; i++) {
        right = Math.sin(2 * Math.PI * i * rotateFreq / samplesPerSecond);
        left = 1 - right;
        l[i] = samples[i] * left;
        r[i] = samples[i] * right;
    }

    return [l, r];
}

var addSounds = function() {

}

var writeFile = function(sounds, filename) {
    var interleaveAndByte = interleaveSounds(sounds);

    writeWAV(interleaveAndByte);
}

var interleaveSounds = function(sounds) {
    // this is where it goes from js numbers to an interleaved byte array
    // 
    var len = sounds.len;
    for(var i = 0; i < len; i++) {
        for(var j =0; j < i.l.length; j++) {

        }
    }
    return new Buffer(size);
}

var writeWAV = function(buffer, filename) {
    var stream = fs.createWriteStream(filename);
}

// do slow ascent from 30 to 120
// add in harmonics
// update left to right freq
// save file
for(var i = startFreq, duration = durationForFreq; i < endFreq; i++) {
    sinX1 = createSin(i, duration);
    sinX2 = createSin(i*2, duration);
    sinX4 = createSin(i*4, duration);
    sinX1LR = addLR(sinX1, sinX1BaseLR_freq);
    sinX2LR = addLR(sinX2, sinX1BaseLR_freq);
    sinX4LR = addLR(sinX4, sinX1BaseLR_freq);
    var mix = add_sounds(sinX1LR, sinX2LR, sinX4LR);
    allSounds.push(mix);
    console.log(i);
}

writeFile(all_sounds, filename);