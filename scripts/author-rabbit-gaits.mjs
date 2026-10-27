// Offline authoring: node scripts/author-rabbit-gaits.mjs
// Writes a candidate to work/gait; run scripts/check-rabbit-gaits.mjs before copying to public/models.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
fs.mkdirSync('work/gait',{recursive:true});
const clipIds={"authored:rabbit:quadruped-walk": "580a31de-dcf7-43f8-a78d-69f24e4186ad", "authored:rabbit:quadruped-trot": "d5382e35-c627-457b-a44d-37fc8e781ec0"};
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader(); loader.register(() => ({ name: 'texture-stub', loadTexture: () => Promise.resolve(new T.Texture()) }));
const bytes=fs.readFileSync('public/models/rabbit.glb');const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
if(createHash('sha256').update(bytes).digest('hex')!=="a374444210a92c13801841c55d837be650e86a0ae508df0a7f33bb8fae11207c")throw new Error('Rabbit skeleton source changed; re-author bone mapping and paw regions.');
const model=gltf.scene;model.updateMatrixWorld(true);let mesh;model.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});
const bones=mesh.skeleton.bones, byName=Object.fromEntries(bones.map(b=>[b.name,b]));
const rest=bones.map(b=>({position:b.position.clone(),quaternion:b.quaternion.clone(),world:b.getWorldPosition(new T.Vector3()),worldQuaternion:b.getWorldQuaternion(new T.Quaternion())}));
const legDefs=[
 {name:'frontRight',chain:[9,10,11],phase:.5,fore:true},
 {name:'frontLeft',chain:[12,13,14],phase:0,fore:true},
 {name:'hindRight',chain:[15,16,17,18],phase:.25,fore:false},
 {name:'hindLeft',chain:[19,20,21,22],phase:.75,fore:false},
];
const vertex=new T.Vector3();for(const leg of legDefs){leg.vertices=[];for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,vertex).applyMatrix4(mesh.matrixWorld);if(vertex.y<.065&&(leg.name.endsWith('Right')?vertex.x<0:vertex.x>0)&&(leg.fore?vertex.z>.12:vertex.z<=.12))leg.vertices.push(i);}}
function worldQ(bone,quaternion){const parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();bone.quaternion.copy(parent.multiply(quaternion));model.updateMatrixWorld(true);}
function turnToward(bone,child,target){const origin=bone.getWorldPosition(new T.Vector3()),current=child.getWorldPosition(new T.Vector3()).sub(origin).normalize(),desired=target.clone().sub(origin).normalize();const delta=new T.Quaternion().setFromUnitVectors(current,desired);worldQ(bone,delta.multiply(bone.getWorldQuaternion(new T.Quaternion())));}
function solve(leg,targets){const [ia,ib,ic,id]=leg.chain,A=bones[ia].getWorldPosition(new T.Vector3()),L1=rest[ia].world.distanceTo(rest[ib].world),L2=rest[ib].world.distanceTo(rest[ic].world),C=targets.ankle;
 const direction=C.clone().sub(A),distance=T.MathUtils.clamp(direction.length(),Math.abs(L1-L2)+.00001,L1+L2-.00001);direction.normalize();
 const pole=rest[ib].world.clone().sub(A);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
 const along=(L1*L1-L2*L2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,L1*L1-along*along)),B=A.clone().addScaledVector(direction,along).addScaledVector(pole,height);
 turnToward(bones[ia],bones[ib],B);turnToward(bones[ib],bones[ic],C);
 if(id!==undefined){turnToward(bones[ic],bones[id],targets.toe);worldQ(bones[id],rest[id].worldQuaternion.clone());}else worldQ(bones[ic],rest[ic].worldQuaternion.clone());
}
function pawFloor(leg){let min=Infinity;for(const i of leg.vertices){mesh.getVertexPosition(i,vertex).applyMatrix4(mesh.matrixWorld);min=Math.min(min,vertex.y);}return min;}
let duration=1,stance=.76,stride=.24,lift=.04;
let activePhases=[.5,0,.25,.75];
function pose(time){for(let i=0;i<bones.length;i++){bones[i].position.copy(rest[i].position);bones[i].quaternion.copy(rest[i].quaternion);}model.updateMatrixWorld(true);
 // Small weight transfer on the real root; planted paw IK remains independent.
 bones[0].position.y += .003 * (1 - Math.cos(time / duration * Math.PI * 4)); model.updateMatrixWorld(true);
 // Lower and incline the chest through the real spine, while the pelvis stays crouched.
 const chest=bones[1],position=rest[1].world.clone().add(new T.Vector3(0,-.016,0));chest.position.copy(chest.parent.worldToLocal(position));model.updateMatrixWorld(true);worldQ(chest,new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.085).multiply(rest[1].worldQuaternion));
 worldQ(bones[3],new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.025).multiply(rest[3].worldQuaternion));
 const info=[],legTargets=[];
 for(const leg of legDefs){const phase=(time/duration+activePhases[legDefs.indexOf(leg)])%1;const swing=phase>=stance;const u=swing?(phase-stance)/(1-stance):phase/stance;
 const z=swing?-stride/2+stride*(u*u*(3-2*u)):stride/2-stride*u;
 const y=swing?lift*Math.sin(Math.PI*u)**2:0;
 const end=leg.chain.at(-1),ankle=leg.chain[2];const targets={ankle:rest[ankle].world.clone().add(new T.Vector3(0,y,z)),toe:rest[end].world.clone().add(new T.Vector3(0,y,z))};
 legTargets.push({leg,targets,y,phase,swing});
 for(let pass=0;pass<5;pass++){solve(leg,targets);const correction=y-pawFloor(leg);targets.ankle.y+=correction;targets.toe.y+=correction;}
 solve(leg,targets);info.push({name:leg.name,phase,swing,targetLift:y,pawFloor:pawFloor(leg),ankle:bones[ankle].getWorldPosition(new T.Vector3()).toArray()});
 }
 for(let pass=0;pass<4;pass++)for(const e of legTargets){const correction=e.y-pawFloor(e.leg);e.targets.ankle.y+=correction;e.targets.toe.y+=correction;solve(e.leg,e.targets);}
 return legTargets.map(e=>({name:e.leg.name,phase:e.phase,swing:e.swing,targetLift:e.y,pawFloor:pawFloor(e.leg),ankle:bones[e.leg.chain[2]].getWorldPosition(new T.Vector3()).toArray()}));
}
const gaits=[], diagnosticsByGait={};
for (const config of [
 {name:'authored:rabbit:quadruped-walk',duration:1,stance:.76,stride:.24,lift:.04,phases:[.5,0,.25,.75]},
 {name:'authored:rabbit:quadruped-trot',duration:.65,stance:.54,stride:.32,lift:.05,phases:[.5,0,0,.5]},
]) {
 ({duration,stance,stride,lift}=config);activePhases=config.phases;model.scale.setScalar(1);model.position.set(0,0,0);mesh.boundingBox=null;model.updateMatrixWorld(true);
 const frames=Math.ceil(duration*120),times=Array.from({length:frames+1},(_,i)=>duration*i/frames),quaternions=bones.map(()=>[]),positions=bones.map(()=>[]),diagnostics=[];
 for(const t of times){const info=pose(t===duration?0:t);diagnostics.push({time:t,feet:info});for(let i=0;i<bones.length;i++){quaternions[i].push(...bones[i].quaternion.toArray());positions[i].push(...bones[i].position.toArray());}}
 const tracks=bones.map((bone,i)=>new T.QuaternionKeyframeTrack(`${bone.name}.quaternion`,times,quaternions[i]));
 for(const i of [0,1])tracks.push(new T.VectorKeyframeTrack(`${bones[i].name}.position`,times,positions[i]));
 const clip=new T.AnimationClip(config.name,duration,tracks);
 for(let i=0;i<bones.length;i++){bones[i].position.copy(rest[i].position);bones[i].quaternion.copy(rest[i].quaternion);}model.scale.setScalar(1);model.position.set(0,0,0);model.updateMatrixWorld(true);
 // Clear a previous cached skinned box before measuring bind-pose normalization.
 mesh.boundingBox=null;const bindBox=new T.Box3().setFromObject(model),scale=1.1/(bindBox.max.y-bindBox.min.y);model.scale.setScalar(scale);model.position.y=-bindBox.min.y*scale;const baseY=model.position.y;
 const mixer=new T.AnimationMixer(model);mixer.clipAction(clip).play();const supportTimes=[],supportValues=[],steps=Math.ceil(duration*240);
 for(let frame=0;frame<=steps;frame++){const t=duration*frame/steps;mixer.setTime(t);model.updateMatrixWorld(true);let min=Infinity;for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,vertex).applyMatrix4(mesh.matrixWorld);min=Math.min(min,vertex.y);}supportTimes.push(t);supportValues.push(baseY-min);}
 mixer.stopAllAction();mixer.uncacheRoot(model);
 clip.tracks.push(new T.NumberKeyframeTrack('.position[y]',supportTimes,supportValues));
 clip.uuid=clipIds[config.name];
 gaits.push({name:config.name,duration,stanceFraction:stance,sourcePawSweep:stride,phaseOffsets:config.phases,cycleDistance:stride*scale/stance,nominalSpeed:stride*scale/stance/duration,clip:clip.toJSON()});
 diagnosticsByGait[config.name]=diagnostics;
}
const output={version:1,source:'rabbit.glb',sourceSHA256:'a374444210a92c13801841c55d837be650e86a0ae508df0a7f33bb8fae11207c',author:'Critter Safari authored skeletal IK gaits, 27 October 2026',normalizationHeight:1.1,gaits,legs:legDefs.map(({name,chain,vertices})=>({name,bones:chain.map(i=>bones[i].name),vertices}))};
// Seven decimal places keep sub-micrometre precision at these model scales.
const compact=JSON.stringify(output,(_,value)=>typeof value==='number'?+value.toFixed(7):value);
fs.writeFileSync('work/gait/rabbit-authored.json',compact);fs.writeFileSync('work/gait/authored-diagnostics.json',JSON.stringify(diagnosticsByGait,null,2));console.log(JSON.stringify({bytes:compact.length,gaits:gaits.map(({name,duration,cycleDistance,nominalSpeed})=>({name,duration,cycleDistance,nominalSpeed}))}));
