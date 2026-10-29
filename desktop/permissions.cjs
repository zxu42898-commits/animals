// Camera access is limited to this app's own local page and video-only requests.
function isAppOrigin(origin,expected){
 try{return new URL(origin).origin===expected;}catch{return false;}
}
function canRequestCamera(permission,origin,expected,types){
 return permission==='media'&&isAppOrigin(origin,expected)&&Array.isArray(types)&&types.length>0&&types.every(type=>type==='video');
}
module.exports={isAppOrigin,canRequestCamera};
