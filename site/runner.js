// Experimental x86 WebAssembly guest runner. Requires separately supplied bootable ISO.
// v86 is a PC emulator, not Wine/Proton or a Windows 10/11 gaming GPU.
(function(){
const BASE='https://cdn.jsdelivr.net/npm/v86@0.5.462/';
let vm=null;
let loading=null;
function loadScript(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>reject(Error('Failed to load emulator runtime'));document.head.append(s)})}
async function load(){if(typeof window.V86==='function')return window.V86;if(!loading)loading=loadScript(BASE+'build/libv86.js').then(()=>{if(typeof window.V86!=='function')throw Error('Emulator script loaded without V86 constructor');return window.V86});return loading}
async function boot({iso,screen,onStatus=()=>{},memoryMiB=128}){
 if(vm)throw Error('Stop the running VM before booting another');
 if(!(iso instanceof File)||!iso.size)throw Error('Select a bootable ISO file first');
 if(!Number.isInteger(memoryMiB)||memoryMiB<32||memoryMiB>512)throw Error('Memory must be 32–512 MiB');
 if(!screen)throw Error('Missing guest display');
 onStatus('Loading x86 WebAssembly emulator…');
 const V86=await load();
 screen.replaceChildren();
 const text=document.createElement('div');text.style.cssText='white-space:pre;font:14px monospace;line-height:14px';
 const canvas=document.createElement('canvas');canvas.style.display='none';screen.append(text,canvas);
 onStatus('Starting virtual PC with '+iso.name+'…');
 try{
 vm=new V86({wasm_path:BASE+'build/v86.wasm',memory_size:memoryMiB*1048576,vga_memory_size:8*1048576,screen_container:screen,bios:{url:BASE+'bios/seabios.bin'},vga_bios:{url:BASE+'bios/vgabios.bin'},cdrom:{buffer:iso},autostart:true});
 vm.add_listener('emulator-ready',()=>onStatus('Virtual PC ready; guest boot is controlled by the selected ISO'));
 vm.add_listener('emulator-started',()=>onStatus('Virtual PC running · '+iso.name));
 return vm;
 }catch(e){vm=null;throw e}
}
async function stop(){if(!vm)return;const old=vm;vm=null;await old.stop();if(typeof old.destroy==='function')await old.destroy()}
function pause(){if(!vm)throw Error('No virtual PC running');vm.stop()}
function resume(){if(!vm)throw Error('No virtual PC running');vm.run()}
window.EXERunner={boot,stop,pause,resume,get running(){return Boolean(vm)},get vm(){return vm}};
})();
