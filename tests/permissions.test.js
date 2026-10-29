import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {canRequestCamera}=createRequire(import.meta.url)('../desktop/permissions.cjs');
test('desktop camera permission allows video only from the app origin',()=>{
 const origin='http://127.0.0.1:12345';
 assert.equal(canRequestCamera('media',origin+'/page',origin,['video']),true);
 for(const [permission,url,types] of [['media',origin,['audio']],['media',origin,['video','audio']],['media',origin,[]],['media',origin,undefined],['media','https://example.com',['video']],['media','http://127.0.0.1:12346',['video']],['media','invalid',['video']],['geolocation',origin,['video']]])assert.equal(canRequestCamera(permission,url,origin,types),false);
});
