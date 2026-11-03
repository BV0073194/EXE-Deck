// Per-tab profile metadata only. Not a Linux account or root credential.
(function(){
const id=crypto.randomUUID(),username='player-'+id.slice(0,8),password=Array.from(crypto.getRandomValues(new Uint8Array(18)),x=>x.toString(16).padStart(2,'0')).join('');
let created=false;
function create(){created=true;return get()}
function get(){return {id,username:created?username:null,password:created?password:null,created,guestAccountProvisioned:false,rootAccess:false}}
window.EXEProfile={create,get};
})();
