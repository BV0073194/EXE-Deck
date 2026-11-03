// Local-browser capabilities and honest execution-path planning.
// WebGPU is an accelerated API, not direct PCIe passthrough or guest GPU emulation.
(function(){
async function detect(){
 const result={webAssembly:typeof WebAssembly==='object',webGPU:false,gpuAdapter:null,
   cpuThreads:navigator.hardwareConcurrency||null,deviceMemoryGiB:navigator.deviceMemory||null,
   crossOriginIsolated:window.crossOriginIsolated===true,sharedMemory:typeof SharedArrayBuffer==='function',
   opfs:!!navigator.storage?.getDirectory,webGL2:false,
   localModernWindowsGames:false,remoteConfigured:false};
 try{const c=document.createElement('canvas');result.webGL2=!!c.getContext('webgl2')}catch(_){}
 try{if(navigator.gpu){const a=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});if(a){result.webGPU=true;result.gpuAdapter='available'}}}catch(_){}
 return result;
}
function plan(file,cap){
 const name=(file?.name||'').toLowerCase(),isWindows=/\.(exe|msi|bat|cmd)$/.test(name);
 if(isWindows)return {route:'unavailable',label:'Windows compatibility backend required',
   explanation:'Wine/Proton and GPU-accelerated Windows game execution are not available in the local browser emulator. A separately provisioned remote backend would be required; none is configured.'};
 return {route:'local-emulator',label:'Experimental local Linux VM',
   explanation:'v86 uses local WebAssembly CPU emulation. WebGPU detection does not accelerate its guest graphics or provide native CPU/GPU passthrough.'};
}
window.EXEHardware={detect,plan};
})();
