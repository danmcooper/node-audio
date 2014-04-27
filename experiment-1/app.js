var fs = require('fs');



var sin_x1, sin_x2, sin_x4;
var sin_x1_lr, sin_x2_lr, sin_x4_lr;

var start_freq = 30;
var end_freq = 120;
var sin_x1_base_lr_freq = 1.0;
var sin_x2_base_lr_freq = .7;
var sin_x4_base_lr_freq = 1.1;
var all_sounds = [];
var filename = "sound.wav";
var samples_per_second = 44100;
var max_amplitude = 1048575; // 20bits - 1 equiv
var durationForFreq = 500;

var create_sin = function(freq, durationMs) {
    var samples = [];
    var numSamples = samples_per_second * durationMs / 1000;
    var sinValue;
    for(var i = 0; i < numSamples; i++) {
        sinValue = 2 * Math.PI * freq  * i / samples_per_second;
        samples[i] = Math.round(max_amplitude * Math.sin(sinValue));
    }
}

var add_lr = function(samples, rotateFreq) {
    // take mono samples, return stereo with l-r mix of about rotateFreq
    rotateFreq = rotateFreq + ((Math.random() - 0.5) * rotateFreq /10);
    l = [], r = [];
    var left, right;
    for (var i = 0; i < samples; i++) {
        right = Math.sin(2 * Math.PI * i * rotateFreq / samples_per_second);
        left = 1 - right;
        l[i] = samples[i] * left;
        r[i] = samples[i] * right;
    }

    return [l, r];
}

var add_sounds = function() {

}

var write_file = function(sounds, filename) {
    var interleave = interleaveSounds(sounds);
    var stream = fs.createWriteStream(filename);

    for(var i = 0; i < sounds)
}

// do slow ascent from 30 to 120
// add in harmonics
// update left to right freq
// save file
for(var i = start_freq, duration = durationForFreq; i < end_freq; i++) {
    sin_x1 = create_sin(i, duration);
    sin_x2 = create_sin(i*2, duration);
    sin_x4 = create_sin(i*4, duration);
    sin_x1_lr = add_lr(sin_x1, sin_x1_base_lr_freq);
    sin_x2_lr = add_lr(sin_x2, sin_x1_base_lr_freq);
    sin_x4_lr = add_lr(sin_x4, sin_x1_base_lr_freq);
    var mix = add_sounds(sin_x1_lr, sin_x2_lr, sin_x4_lr);
    all_sounds.push(mix);
    console.log(i);
}

write_file(all_sounds, filename);