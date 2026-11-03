// Experimental x86 WebAssembly guest runner. Requires separately supplied bootable ISO.
// Each tab creates its own VM RAM and emulator. The ISO is read-only CD-ROM media.
// No writable guest hard disk or networking is attached. This is not a security sandbox for hostile code.
// v86 is a PC emulator, not Wine/Proton or a Windows 10/11 gaming GPU.
(function(){
const BASE='https://cdn.jsdelivr.net/npm/v86@0.5.462/';
const DEFAULT_LINUX='https://i.copy.sh/linux.iso'; // Remote demo image; unverified upstream availability
let vm=null;
let loading=null;
let starting=false;
function loadScript(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>reject(Error('Failed to load emulator runtime'));document.head.append(s)})}
async function load(){if(typeof window.V86==='function')return window.V86;if(!loading)loading=loadScript(BASE+'build/libv86.js').then(()=>{if(typeof window.V86!=='function')throw Error('Emulator script loaded without V86 constructor');return window.V86}).catch(e=>{loading=null;throw e});return loading}
async function boot({iso,screen,onStatus=()=>{},memoryMiB=128}){
 if(vm||starting)return vm;
 if(iso!==undefined&&(!(iso instanceof File)||!iso.size))throw Error('Select a valid bootable ISO file');
 if(!Number.isInteger(memoryMiB)||memoryMiB<32||memoryMiB>8192)throw Error('Memory must be 32–8192 MiB');
 if(!screen)throw Error('Missing guest display');
 if(memoryMiB>=4096)onStatus('Warning: large VM RAM allocation may exceed browser/WebAssembly limits');
 starting=true;
 onStatus('Loading x86 WebAssembly emulator…');
 let V86;
 try{V86=await load()}catch(e){starting=false;throw e}
 screen.replaceChildren();
 const text=document.createElement('div');text.style.cssText='white-space:pre;font:14px monospace;line-height:14px';
 const canvas=document.createElement('canvas');canvas.style.display='none';screen.append(text,canvas);
 onStatus('Starting virtual PC with '+(iso?.name||'default Linux demo image')+'…');
 try{
 vm=new V86({wasm_path:BASE+'build/v86.wasm',memory_size:memoryMiB*1048576,vga_memory_size:8*1048576,screen_container:screen,bios:{url:BASE+'bios/seabios.bin'},vga_bios:{url:BASE+'bios/vgabios.bin'},cdrom:iso?{buffer:iso}:{url:DEFAULT_LINUX},network_relay_url:undefined,autostart:true});
 vm.add_listener('emulator-ready',()=>onStatus('Virtual PC ready; guest boot is controlled by the selected ISO'));
 vm.add_listener('emulator-started',()=>onStatus('Virtual PC running · '+(iso?.name||'default Linux demo image')));
 vm.add_listener('emulator-stopped',()=>onStatus('Virtual PC stopped'));
 starting=false;return vm;
 }catch(e){starting=false;vm=null;throw e}
}
async function stop(){if(starting)throw Error('Guest startup is still in progress');if(!vm)return;const old=vm;vm=null;await old.stop();if(typeof old.destroy==='function')await old.destroy()}
function pause(){if(!vm)throw Error('No virtual PC running');vm.stop()}
function resume(){if(!vm)throw Error('No virtual PC running');vm.run()}
window.EXERunner={boot,stop,pause,resume,DEFAULT_LINUX,get running(){return Boolean(vm)}};
})();
