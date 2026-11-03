// Advisory Windows application runner selection. Does not execute binaries.
(function(){
'use strict';
const signatures=[{kind:'msi',name:'Windows Installer',runner:'wine-msiexec',reason:'MSI package requires Windows Installer compatibility'},{kind:'exe',name:'Windows executable',runner:'wine',reason:'General Windows PE executable'}];
function classify(name,bytes){
 const ext=String(name||'').toLowerCase().split('.').pop();
 const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[]);
 const pe=b.length>=64&&b[0]===77&&b[1]===90;
 const msi=b.length>=8&&[208,207,17,224,161,177,26,225].every((n,i)=>b[i]===n);
 if(ext==='msi'&&msi)return {...signatures[0],confidence:'signature'};
 if(ext==='exe'&&pe)return {...signatures[1],confidence:'signature'};
 if(ext==='bat'||ext==='cmd')return {kind:'script',name:'Windows command script',runner:'wine-cmd',confidence:'extension',reason:'Requires Windows command interpreter'};
 if(ext==='msi'||ext==='exe')return {kind:'unknown',name:'Unrecognized binary',runner:null,confidence:'none',reason:'File signature does not match extension'};
 return {kind:'unsupported',name:'Unsupported file type',runner:null,confidence:'none',reason:'No compatible handler'};
}
async function inspect(file){
 if(!(file instanceof File))throw Error('Choose a local Windows application file');
 const header=new Uint8Array(await file.slice(0,4096).arrayBuffer());
 const result=classify(file.name,header);
 return Object.freeze({...result,filename:file.name,size:file.size,executable:false,runtimeInstalled:false});
}
window.EXERunnerSelect=Object.freeze({classify,inspect});
})();
