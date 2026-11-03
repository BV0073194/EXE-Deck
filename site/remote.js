// Browser-only remote-session entry point. Does not host or provision GPU servers.
(function(){
function validate(raw){
 let u;
 try{u=new URL(raw)}catch(_){throw Error('Enter a complete HTTPS URL')}
 if(u.protocol!=='https:')throw Error('Remote sessions require HTTPS');
 if(u.username||u.password)throw Error('Do not embed credentials in a URL');
 if(u.hash)throw Error('Remove URL fragments before connecting');
 if(!u.hostname)throw Error('Missing hostname');
 return u.href;
}
function platform(){
 const ua=navigator.userAgent||'';
 const ios=/iPhone|iPad|iPod/.test(ua)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const android=/Android/.test(ua);
 const mobile=ios||android;
 return {ios,android,mobile,standalone:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,
  storage:!!navigator.storage?.getDirectory,fullscreen:!!document.documentElement.requestFullscreen,
  fileSystemAccess:typeof window.showOpenFilePicker==='function'};
}
window.EXERemote={validate,platform};
})();
