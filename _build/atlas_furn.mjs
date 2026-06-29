// Inside_B rows gy6..11 (both halves). id = gx<8 ? gy*8+gx : 128+gy*8+(gx-8)
import { savePreview, fillLayer, setT } from './maplib.mjs';
const TSID=3, W=16, H=6;
const map={width:W,height:H,tilesetId:TSID,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2048+16*48);
const bid=(gx,gy)=> gx<8 ? gy*8+gx : 128+gy*8+(gx-8);
for(let r=0;r<H;r++) for(let gx=0;gx<16;gx++) setT(map,gx,r,2, bid(gx, 6+r));
savePreview(map,TSID,'_build/atlas_furn.png',3);
// print the id grid for reference
for(let r=0;r<H;r++){ let line='gy'+(6+r)+': '; for(let gx=0;gx<16;gx++) line+=bid(gx,6+r)+' '; console.error(line); }
