# Critter Safari audio

Prepared for the active fixed-camera rebuild. The music engine passed an independent check before the gameplay redesign; its new gameplay integration still needs a model-ready browser pass.

## Original score

“Fern Garden Waltz” is an original authored composition for this game: 32 bars,3/4,100 BPM,D major,57.6 seconds. A recurring woodwind melody passes between flute and clarinet over pizzicato strings, harp arpeggios, bassoon, restrained strings and celesta responses. No copied song, vocal, rain loop or continuous noise layer is used. It was composed in code and rendered with sampled instruments; it is not represented as output from a music-generation platform.

Music-source authoring: scripts/compose-score.py; retained original MIDI at assets/audio/fern-garden.mid. Offline rendering/mastering: scripts/render-audio.py. The tail wraps into the beginning of the loop; its raw boundary step was about0.00049 full scale, and the source had zero clipped PCM samples. Export loudness targets are -20 LUFS for music and -18 LUFS for brief effects, with a -2 dBTP ceiling; runtime mixing is quieter and has a final dynamics compressor.

## Instruments and rights

Rendered with **GeneralUser GS2.0.3 by S. Christian Collins**, using FluidSynth2.6.1. The author's license explicitly permits unrestricted private/commercial music creation and profitable musical recordings. The SoundFont itself stays in ignored work/audio and is not shipped in the game. Sources: [author's project](https://github.com/mrbumpy409/GeneralUser-GS), [license](https://github.com/mrbumpy409/GeneralUser-GS/blob/main/documentation/LICENSE.txt). Only this game's original rendered composition/effects and original MIDI are included.

## Sound effects

Five small musical cues use the same palette: bait pluck, woodblock trap click, rising bubble notes, ascending celesta safe-capture flourish, and a gentle harp release phrase. They replace the old single-oscillator chirps. No diagnostic sound or noise bed is left running.

## Runtime behavior

Audio begins only after a user gesture. Six local MP3 buffers are decoded once. One looping music source serves the whole session, across pause/resume and restart; completed effect voices disconnect after playback. Music fades out during reading/help/pause and ducks during capture review. Pause provides independent Hebrew-labeled music/effects level sliders plus global mute. No streaming service, remote music request or runtime AI is required.

Verification is recorded in docs/verification/audio.json after the independent browser check. Taste and musical feel remain subjective; the preview is supplied for listening.
