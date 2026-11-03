// Per-tab machine session manager. This is infrastructure, NOT a Linux/Wine runtime.
const sessionId=crypto.randomUUID();
const state={id:sessionId,started:new Date().toISOString(),phase:'idle',disk:null,worker:null,releaseLock:null,lockPromise:null};
const listeners=new Set();
function emit(){const info={id:state.id,started:state.started,phase:state.phase,disk:state.disk};for(const fn of listeners)fn(info)}
function subscribe(fn){listeners.add(fn);fn({id:state.id,started:state.started,phase:state.phase,disk:state.disk});return()=>listeners.delete(fn)}
async function acquireDisk(name){if(!navigator.locks)throw Error('Web Locks unavailable: cannot safely coordinate disk ownership across tabs');let entered;const acquired=new Promise(resolve=>entered=resolve);let release;const hold=new Promise(resolve=>release=resolve);const lockName='exe-deck-device-disk:'+name;
const pending=navigator.locks.request(lockName,{mode:'exclusive',ifAvailable:true},async lock=>{entered(Boolean(lock));if(lock)await hold});
if(!await acquired){await pending;throw Error('This disk is already owned by another EXE Deck tab. Select a different disk or unmount it in the other tab.')}
state.releaseLock=release;state.lockPromise=pending}
async function mountSelected(disk){if(state.disk)throw Error('Unmount this tab’s disk first');await acquireDisk(disk.name);try{state.disk=disk;state.phase='disk-attached';emit()}catch(e){state.releaseLock?.();await state.lockPromise;state.releaseLock=null;state.lockPromise=null;throw e}}
async function unmount(){if(state.disk){await state.disk.close();state.disk=null}state.releaseLock?.();if(state.lockPromise)await state.lockPromise;state.releaseLock=null;state.lockPromise=null;state.phase='idle';emit()}
function start(){throw Error('Linux/Wine WebAssembly runtime is not installed. Disk sessions are available, but Windows executables cannot run yet.')}
window.EXEMachine={id:sessionId,subscribe,mountSelected,unmount,start,get state(){return {id:state.id,phase:state.phase,disk:state.disk?.name||null}}};
