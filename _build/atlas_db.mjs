// Dungeon_B objects (id = gx<8 ? gy*8+gx : 128+gy*8+gx-8) over a floor bg.
import { savePreview, fillLayer, setT } from './maplib.mjs';
const TSID=4, W=16, H=16;
const map={width:W,height:H,tilesetId:TSID,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2048+16*48);
const bid=(gx,gy)=> gx<8 ? gy*8+gx : 128+gy*8+(gx-8);
for(let gy=0;gy<16;gy++)for(let gx=0;gx<16;gx++) setT(map,gx,gy,2, bid(gx,gy));
savePreview(map,TSID,'_build/atlas_db.png',2);
for(let gy=0;gy<16;gy++){ let l='gy'+gy+': '; for(let gx=0;gx<16;gx++) l+=bid(gx,gy)+' '; console.error(l); }
