"""Offline audio build. Run compose-score.py, then pass a GeneralUser GS .sf2 path.
Requires official FluidSynth and FFmpeg executables. Font stays outside the runtime.
"""
from pathlib import Path
import array,subprocess,sys,wave,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'work/audio';OUT=ROOT/'public/audio'
if len(sys.argv)!=2:raise SystemExit('Usage: python3 scripts/render-audio.py /path/to/GeneralUser-GS.sf2')
font=Path(sys.argv[1]).resolve();OUT.mkdir(parents=True,exist_ok=True)
for midi in WORK.glob('*.mid'):
 subprocess.run(['fluidsynth','-ni','-q','-g','0.6','-r','44100','-R','1','-C','0','-F',str(midi.with_suffix('.wav')),'-T','wav','-O','s16',str(font),str(midi)],check=True)
with wave.open(str(WORK/'fern-garden.wav')) as source:
 rate=source.getframerate();channels=source.getnchannels();raw=array.array('h',source.readframes(source.getnframes()))
 if sys.byteorder!='little':raw.byteswap()
 samples=round(57.6*rate)*channels;tail=raw[samples:samples+round(2.5*rate)*channels];loop=raw[:samples]
 for i,value in enumerate(tail):
  fade=min(1,(len(tail)-i)/(0.12*rate*channels));loop[i]=max(-32768,min(32767,loop[i]+round(value*fade)))
 loop=array.array('h',(round(v*.9) for v in loop))
 stats={'loopSeconds':57.6,'sourceClippedSamples':sum(abs(v)>=32767 for v in raw),'sourcePeak':max(abs(v) for v in raw)/32768,'fontSha256':hashlib.sha256(font.read_bytes()).hexdigest()}
 if sys.byteorder!='little':loop.byteswap()
 with wave.open(str(WORK/'fern-loop.wav'),'wb') as dest:dest.setparams((channels,2,rate,0,'NONE','not compressed'));dest.writeframes(loop.tobytes())
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(WORK/'fern-loop.wav'),'-af','loudnorm=I=-20:LRA=8:TP=-2','-ar','44100','-c:a','libmp3lame','-q:a','3',str(OUT/'fern-garden.mp3')],check=True)
for name,duration in [('capture',2.2),('release',2.1),('bait',1.1),('trap',.75),('pulse',1.65)]:
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(WORK/(name+'.wav')),'-t',str(duration),'-af',f'afade=t=out:st={duration-.15}:d=0.15,loudnorm=I=-18:LRA=7:TP=-2','-ar','44100','-c:a','libmp3lame','-q:a','4',str(OUT/(name+'.mp3'))],check=True)
(WORK/'render-analysis.json').write_text(json.dumps(stats,indent=2));print(stats)
