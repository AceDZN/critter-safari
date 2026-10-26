"""Original Critter Safari score. No copied melody; standard-library MIDI authoring.
Render with GeneralUser GS and FluidSynth; see AUDIO.md for instruments/license.
"""
from pathlib import Path
import struct
PPQ=480
BPM=100
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'work/audio'
OUT.mkdir(parents=True,exist_ok=True)
def var(n):
    a=[n&127];n>>=7
    while n:a.insert(0,(n&127)|128);n>>=7
    return bytes(a)
def track(events,end):
    body=b'';last=0
    for tick,msg in sorted(events,key=lambda e:e[0]):body+=var(tick-last)+msg;last=tick
    body+=var(max(0,end-last))+b'\xff\x2f\x00'
    return b'MTrk'+struct.pack('>I',len(body))+body
def note(events,ch,pitch,start,duration,vel):
    if pitch is None:return
    events.extend([(round(start*PPQ),bytes([0x90+ch,pitch,vel])),(round((start+duration)*PPQ),bytes([0x80+ch,pitch,0]))])
def midi(path,parts,beats):
    meta=[(0,b'\xff\x51\x03'+round(60000000/BPM).to_bytes(3,'big')),(0,b'\xff\x58\x04\x03\x02\x18\x08'),(0,b'\xff\x59\x02\x02\x00')]
    tracks=[track(meta,round(beats*PPQ))]
    for ch,program,volume,pan,notes in parts:
        ev=[(0,bytes([0xc0+ch,program])),(0,bytes([0xb0+ch,7,volume])),(0,bytes([0xb0+ch,10,pan])),(0,bytes([0xb0+ch,91,32]))]
        for n in notes:note(ev,ch,*n)
        tracks.append(track(ev,round(beats*PPQ)))
    path.write_bytes(b'MThd'+struct.pack('>IHHH',6,1,len(tracks),PPQ)+b''.join(tracks))
# root and three upper chord tones; size/speed gameplay has no audio answer cue.
chords=[(38,[62,66,69]),(47,[62,66,71]),(43,[62,67,71]),(45,[61,64,69]),(42,[62,66,69]),(40,[62,64,67]),(43,[62,67,71]),(45,[61,64,67]),(47,[62,66,71]),(43,[62,67,71]),(45,[62,66,69]),(45,[62,64,69]),(40,[64,67,71]),(45,[61,64,69]),(43,[62,67,71]),(38,[62,66,69])]
phrases=[[(74,.5),(78,.5),(81,1),(78,.5),(76,.5)],[(74,1),(71,.5),(74,.5),(78,1)],[(79,.75),(78,.25),(76,.5),(74,.5),(71,1)],[(73,.5),(76,.5),(69,1),(None,1)],[(74,.5),(76,.5),(78,1),(81,.5),(78,.5)],[(76,1),(79,.5),(78,.5),(76,1)],[(74,.5),(71,.5),(74,1),(79,.5),(78,.5)],[(76,.5),(73,.5),(69,1.5),(None,.5)],[(78,1),(81,.5),(83,.5),(81,1)],[(79,.5),(78,.5),(74,1),(71,1)],[(78,.5),(76,.5),(74,1.5),(None,.5)],[(76,.5),(73,.5),(69,1),(73,1)],[(76,.5),(79,.5),(83,1),(81,.5),(79,.5)],[(81,.5),(79,.5),(76,1),(73,1)],[(74,1),(71,.5),(67,.5),(71,.5),(73,.5)],[(74,2),(None,1)]]
flute=[];pizz=[];harp=[];bass=[];bells=[];strings=[];clarinet=[]
for bar in range(32):
    t=bar*3;root,chord=chords[bar%16]
    bass.append((root,t,.72,57 if bar%4==0 else 48))
    # Waltz pulse, with small human timing/velocity variation.
    for beat in [1,2]:
        for j,p in enumerate(chord):pizz.append((p,t+beat+j*.014,.28,45+(bar+beat+j)%7))
    if bar%4!=3:
        for j,p in enumerate([chord[0],chord[1],chord[2],chord[1]]):harp.append((p+12,t+j*.5+.015,.55,34+j%2*5))
    cursor=t+.045
    for j,(p,dur) in enumerate(phrases[bar%16]):
        if not (bar>=16 and bar%8 in [2,3]):flute.append((p,cursor,max(.1,dur*.84),56+j%3*3))
        elif p is not None:clarinet.append((p-12,cursor,max(.1,dur*.88),51+j%2*4))
        cursor+=dur
    if bar%4==3:
        for j,p in enumerate([chord[1]+12,chord[2]+12,chord[0]+24]):bells.append((p,t+2+j*.25,.5,43-j*3))
    if bar>=8 and bar%2==0:
        for p in chord:strings.append((p-12,t+.1,5.5,25))
parts=[(0,73,86,76,flute),(1,45,76,42,pizz),(2,46,72,91,harp),(3,70,74,61,bass),(4,8,70,75,bells),(5,48,55,60,strings),(6,71,82,53,clarinet)]
midi(OUT/'fern-garden.mid',parts,96)
# Matching small melodic stingers; no continuous noise bed.
for name,notes,program in [('capture',[(74,0,.16,79),(78,.14,.16,75),(81,.28,.2,78),(86,.44,.5,67)],8),('release',[(76,0,.22,62),(73,.2,.22,57),(69,.4,.35,51)],46),('bait',[(81,0,.09,68),(86,.07,.13,52)],12),('trap',[(50,0,.12,67),(62,.04,.1,42)],115),('pulse',[(62,0,.12,64),(69,.06,.14,60),(74,.12,.24,52)],8)]:midi(OUT/(name+'.mid'),[(0,program,95,64,notes)],2.5)
print('Original 32-bar score: D major, 3/4, 100 BPM, 57.6 seconds. MIDI source written.')
