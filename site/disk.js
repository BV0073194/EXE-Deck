// EXE Deck disk engine: fixed VHD, backed by browser OPFS.
// This is a real VHD container with an MBR and FAT32 volume, not a simulated folder.
// VHDX is intentionally not written until a validated VHDX implementation is available.
const ROOT='exe-deck-disks';
const SECTOR=512;
const te=new TextEncoder();
const dv=(b)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
function ascii(b,o,s,n=s.length){for(let i=0;i<n;i++)b[o+i]=i<s.length?s.charCodeAt(i):0}
function be32(b,o,v){dv(b).setUint32(o,v>>>0,false)}
function be64(b,o,v){dv(b).setBigUint64(o,BigInt(v),false)}
function le16(b,o,v){dv(b).setUint16(o,v,true)}
function le32(b,o,v){dv(b).setUint32(o,v>>>0,true)}
function checksum(b,skip,len=4){let sum=0;for(let i=0;i<b.length;i++)if(i<skip||i>=skip+len)sum=(sum+b[i])>>>0;return (~sum)>>>0}
function footer(bytes){const b=new Uint8Array(512);ascii(b,0,'conectix');be32(b,8,2);be32(b,12,0x10000);be64(b,16,0xffffffffffffffffn);be32(b,24,Math.floor((Date.now()-Date.UTC(2000,0,1))/1000));ascii(b,28,'EXDK');be32(b,32,0x00010000);ascii(b,36,'Wi2k');be64(b,40,BigInt(bytes));be64(b,48,BigInt(bytes));const total=bytes/512;let heads=16,sectors=63,cyl=Math.floor(total/(heads*sectors));if(cyl>65535)cyl=65535;be32(b,56,((cyl&65535)<<16)|(heads<<8)|sectors);be32(b,60,2);crypto.getRandomValues(b.subarray(68,84));b[84]=0;be32(b,64,checksum(b,64));return b}
function boot(total,clusterSectors,fatSectors,serial){const b=new Uint8Array(512);b.set([0xeb,0x58,0x90],0);ascii(b,3,'EXEDECK ');le16(b,11,512);b[13]=clusterSectors;le16(b,14,32);b[16]=2;le16(b,17,0);le16(b,19,0);b[21]=0xf8;le16(b,22,0);le16(b,24,63);le16(b,26,255);le32(b,28,2048);le32(b,32,total);le32(b,36,fatSectors);le16(b,40,0);le16(b,42,0);le32(b,44,2);le16(b,48,1);le16(b,50,6);b[64]=0x80;b[66]=0x29;le32(b,67,serial);ascii(b,71,'EXEDECK   ');ascii(b,82,'FAT32   ');b[510]=0x55;b[511]=0xaa;return b}
function fsinfo(){const b=new Uint8Array(512);le32(b,0,0x41615252);le32(b,484,0x61417272);le32(b,488,0xffffffff);le32(b,492,0xffffffff);le32(b,508,0xaa550000);return b}
function partitionTable(total){const b=new Uint8Array(512);const o=446;b[o]=0x80;b[o+1]=0xfe;b[o+2]=0xff;b[o+3]=0xff;b[o+4]=0x0c;b[o+5]=0xfe;b[o+6]=0xff;b[o+7]=0xff;le32(b,o+8,2048);le32(b,o+12,total-2048);b[510]=0x55;b[511]=0xaa;return b}
function fatParams(total){const vol=total-2048;let spc=1,fats=1;while(true){fats=Math.ceil((Math.floor((vol-32-2*fats)/spc)+2)*4/512);const clusters=Math.floor((vol-32-2*fats)/spc);if(clusters>=65525&&clusters<=0x0ffffff5)return {spc,fats,clusters};if(clusters<65525)throw Error('FAT32 needs a disk of at least about 34 MiB');spc*=2;if(spc>128)throw Error('Disk is too large for this formatter')}}
async function root(){if(!navigator.storage?.getDirectory)throw Error('This browser does not support OPFS');return (await navigator.storage.getDirectory()).getDirectoryHandle(ROOT,{create:true})}
async function writeAt(handle,offset,data){const w=await handle.createWritable({keepExistingData:true});try{await w.write({type:'write',position:offset,data});await w.close()}catch(e){await w.abort();throw e}}
async function formatVHD(handle,mib,progress){const bytes=mib*1048576;if(bytes%512)throw Error('Invalid size');const total=bytes/512;const {spc,fats}=fatParams(total);const serial=crypto.getRandomValues(new Uint32Array(1))[0];const writer=await handle.createWritable();try{await writer.truncate(bytes+512);progress('Creating partition table');await writer.write({type:'write',position:0,data:partitionTable(total)});const start=2048*512;const bootSector=boot(total-2048,spc,fats,serial);const info=fsinfo();await writer.write({type:'write',position:start,data:bootSector});await writer.write({type:'write',position:start+512,data:info});await writer.write({type:'write',position:start+6*512,data:bootSector});await writer.write({type:'write',position:start+7*512,data:info});const fatStart=start+32*512;const entries=new Uint8Array(512);le32(entries,0,0x0ffffff8);le32(entries,4,0xffffffff);le32(entries,8,0x0fffffff);await writer.write({type:'write',position:fatStart,data:entries});await writer.write({type:'write',position:fatStart+fats*512,data:entries});await writer.write({type:'write',position:bytes,data:footer(bytes)});progress('Finalizing disk image');await writer.close()}catch(e){await writer.abort();throw e}}
async function inspect(handle){const file=await handle.getFile();if(file.size<1024)throw Error('File is too small');const f=new Uint8Array(await file.slice(-512).arrayBuffer());if(new TextDecoder().decode(f.slice(0,8))!=='conectix')throw Error('Not a fixed VHD (VHDX and dynamic VHD are not supported yet)');const view=dv(f);if(view.getUint32(60,false)!==2||view.getUint32(64,false)!==checksum(f,64))throw Error('Unsupported or invalid VHD footer');const bytes=Number(view.getBigUint64(48,false));if(bytes+512!==file.size)throw Error('VHD size mismatch');return {bytes,mib:bytes/1048576}}
async function listDisks(){const dir=await root(),out=[];for await(const [name,entry] of dir.entries())if(entry.kind==='file'&&name.endsWith('.vhd')){try{out.push({name,...await inspect(entry)})}catch(e){out.push({name,error:e.message})}}return out}
async function createDisk(name,mib,progress){if(!/^[a-z0-9][a-z0-9._-]{0,60}\.vhd$/i.test(name))throw Error('Use a .vhd filename with letters, numbers, dots, underscores or hyphens');if(!Number.isInteger(mib)||mib<64||mib>2048)throw Error('Choose a size from 64 to 2048 MiB');const dir=await root();try{await dir.getFileHandle(name);throw Error('A disk with this name already exists')}catch(e){if(e.name!=='NotFoundError')throw e}const handle=await dir.getFileHandle(name,{create:true});try{await formatVHD(handle,mib,progress)}catch(e){await dir.removeEntry(name).catch(()=>{});throw e}return inspect(handle)}
async function diskFile(name){const dir=await root();return dir.getFileHandle(name)}
async function removeDisk(name){const dir=await root();await dir.removeEntry(name)}
async function saveDisk(name,progress){const handle=await diskFile(name),file=await handle.getFile();if(window.showSaveFilePicker){const dest=await window.showSaveFilePicker({suggestedName:name,types:[{description:'Virtual hard disk',accept:{'application/octet-stream':['.vhd']}}]});const w=await dest.createWritable();try{let offset=0;for(let offset=0;offset<file.size;offset+=1048576){const chunk=new Uint8Array(await file.slice(offset,Math.min(offset+1048576,file.size)).arrayBuffer());await w.write(chunk);progress('Writing '+Math.round((offset+chunk.length)/file.size*100)+'%')}await w.close()}catch(e){await w.abort();throw e}return}const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function attachDisk(name){const h=await diskFile(name);const info=await inspect(h);return {name,...info,read:async(offset,length)=>{if(offset<0||length<0||offset+length>info.bytes)throw Error('Out of range');return new Uint8Array(await (await h.getFile()).slice(offset,offset+length).arrayBuffer())},write:async(offset,data)=>{if(offset<0||offset+data.length>info.bytes)throw Error('Out of range');await writeAt(h,offset,data)},flush:async()=>{},close:async()=>{}}}

// External disk file backend. Read/write access is permission-gated.
// Browser createWritable() stages changes until close; this is NOT native in-place I/O.
async function openExternalDisk(){
 if(!window.showOpenFilePicker)throw Error('Live device-file handles require a supported desktop browser. Safari on iPhone cannot grant direct writable access to Files-app documents.');
 const [handle]=await showOpenFilePicker({multiple:false,types:[{description:'Virtual disk images',accept:{'application/octet-stream':['.vhd','.vhdx']}}]});
 const file=await handle.getFile();
 const header=new TextDecoder().decode(new Uint8Array(await file.slice(0,8).arrayBuffer()));
 const isVHDX=header==='vhdxfile';
 const info=isVHDX?{bytes:file.size,mib:Math.round(file.size/1048576*100)/100,format:'VHDX (raw container bytes)'}:{...await inspect(handle),format:'Fixed VHD'};
 const permission=await handle.requestPermission({mode:'readwrite'});
 const writable=permission==='granted'&&!isVHDX;
 let closed=false,stream=null;
 let changes=[];let queue=Promise.resolve();
 const serial=fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p};
 const check=(offset,length)=>{if(closed)throw Error('Disk is unmounted');if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0||offset+length>file.size)throw Error('Read/write outside disk image')};
 async function commit(){if(stream){await stream.close();stream=null;changes=[]}}
 return {name:handle.name,external:true,readOnly:!writable,stagedWrites:writable,...info,
  read:(offset,length)=>serial(async()=>{check(offset,length);const source=await handle.getFile();const data=new Uint8Array(await source.slice(offset,offset+length).arrayBuffer());for(const ch of changes){const start=Math.max(offset,ch.offset),end=Math.min(offset+length,ch.offset+ch.data.length);if(end>start)data.set(ch.data.subarray(start-ch.offset,end-ch.offset),start-offset)}return data}),
  write:(offset,data)=>serial(async()=>{if(!writable)throw Error(isVHDX?'VHDX sector writes require a validated VHDX driver; raw writes are disabled to protect the disk':'Read-only permission');if(!(data instanceof Uint8Array))throw Error('Write data must be Uint8Array');check(offset,data.length);if(!stream)stream=await handle.createWritable({keepExistingData:true});const copy=data.slice();await stream.write({type:'write',position:offset,data:copy});changes.push({offset,data:copy});if(changes.length>128)await commit()}),
  flush:()=>serial(commit),
  close:()=>serial(async()=>{if(closed)return;await commit();closed=true})
 };
}
async function createDeviceDisk(name,mib,progress){if(!window.showSaveFilePicker)throw Error('Direct device disk creation needs a supported desktop Chromium browser. This website cannot directly write Files-app documents on iOS.');if(!/^[a-z0-9][a-z0-9._-]{0,60}\\.vhd$/i.test(name))throw Error('Enter a .vhd filename');if(!Number.isInteger(mib)||mib<64||mib>2048)throw Error('Choose 64–2048 MiB');const handle=await showSaveFilePicker({suggestedName:name,types:[{description:'Virtual hard disk',accept:{'application/octet-stream':['.vhd']}}]});await formatVHD(handle,mib,progress);return {name:handle.name,...await inspect(handle)}}
window.EXEDisk={createDeviceDisk,openExternalDisk,createDisk,listDisks,removeDisk,saveDisk,attachDisk,inspect};
