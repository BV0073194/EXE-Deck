// Per-tab EXE Deck session identity. Never represents Linux root credentials.
// sessionStorage is scoped to a top-level tab, but browser duplicate-tab actions may clone it.
(function(){
'use strict';
const KEY='exe-deck-profile-v2';
let profile=null;
try{
 const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');
 if(saved&&typeof saved.id==='string'&&/^player-[a-f0-9]{8}$/.test(saved.username)&&/^[a-f0-9]{48}$/.test(saved.password))profile=saved;
}catch(_){}
function create(){
 if(!profile){
  const id=crypto.randomUUID();
  const username='player-'+id.replace(/-/g,'').slice(0,8);
  const password=Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
  profile={id,username,password};
  try{sessionStorage.setItem(KEY,JSON.stringify(profile))}catch(_){}
 }
 return get();
}
function get(){return Object.freeze({id:profile?.id||null,username:profile?.username||null,password:profile?.password||null,created:Boolean(profile),guestAccountProvisioned:false,rootAccess:false})}
function reset(){profile=null;try{sessionStorage.removeItem(KEY)}catch(_){}return get()}
window.EXEProfile=Object.freeze({create,get,reset});
})();
