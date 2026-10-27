"""Inspect local GLB rig/animation structure without executing a renderer."""
from pathlib import Path
import hashlib,json,struct
ROOT=Path(__file__).resolve().parents[1]
FORMATS={5126:'f',5125:'I',5123:'H',5122:'h',5121:'B',5120:'b'}
COUNTS={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def inspect(path):
 data=path.read_bytes();assert data[:4]==b'glTF';offset=12;chunks={}
 while offset<len(data):
  size,kind=struct.unpack_from('<II',data,offset);chunks[kind]=data[offset+8:offset+8+size];offset+=8+size
 doc=json.loads(chunks[0x4e4f534a]);binary=chunks[0x004e4942]
 def values(index):
  a=doc['accessors'][index];view=doc['bufferViews'][a['bufferView']];fmt='<'+FORMATS[a['componentType']]*COUNTS[a['type']];size=struct.calcsize(fmt);start=view.get('byteOffset',0)+a.get('byteOffset',0);stride=view.get('byteStride',size)
  return [struct.unpack_from(fmt,binary,start+i*stride) for i in range(a['count'])]
 joints={i for skin in doc.get('skins',[]) for i in skin.get('joints',[])}
 parents={child:i for i,node in enumerate(doc['nodes']) for child in node.get('children',[])}
 roots={j for j in joints if parents.get(j) not in joints}
 clips=[]
 for clip in doc.get('animations',[]):
  varying=0;root_xz=0;duration=0
  for channel in clip['channels']:
   sampler=clip['samplers'][channel['sampler']];duration=max(duration,max(v[0] for v in values(sampler['input'])));rows=values(sampler['output']);ranges=[max(v[c] for v in rows)-min(v[c] for v in rows) for c in range(len(rows[0]))]
   if channel['target']['node'] in joints and max(ranges)>1e-5:varying+=1
   if channel['target']['node'] in roots and channel['target']['path']=='translation':root_xz=max(root_xz,ranges[0],ranges[2])
  clips.append({'name':clip.get('name'),'duration':duration,'channels':len(clip['channels']),'varyingSkeletalChannels':varying,'rootXZRange':root_xz})
 primitives=[p for mesh in doc.get('meshes',[]) for p in mesh['primitives']]
 result={'file':str(path.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'skins':len(doc.get('skins',[])),'joints':len(joints),'weightedPrimitives':sum('JOINTS_0'in p['attributes'] and 'WEIGHTS_0'in p['attributes'] for p in primitives),'triangles':sum(doc['accessors'][p['indices']]['count']//3 if 'indices'in p else doc['accessors'][p['attributes']['POSITION']]['count']//3 for p in primitives),'clips':clips}
 assert result['skins']>0 and result['weightedPrimitives']>0 and result['joints']>=20
 assert clips and all(c['duration']>0 and c['varyingSkeletalChannels']>=10 and c['rootXZRange']<1e-3 for c in clips)
 return result
rows=[inspect(ROOT/'public/models'/f'{kind}.glb') for kind in ['rabbit','tortoise','deer']]
out=ROOT/'docs/verification/rebuild-rigs.json';out.write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows,indent=2))
