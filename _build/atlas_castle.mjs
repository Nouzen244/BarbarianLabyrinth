// Outside_C right half (gx8-15) all rows — castle towers/gates live here.
// id = 256 + 128 + gy*8 + col  (col = gx-8), i.e. 384 + gy*8 + col
import { savePreview, fillLayer, setT } from './maplib.mjs';
const TSID=2, W=8, H=16;
const map={width:W,height:H,tilesetId:TSID,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2816); // grass bg
for(let gy=0;gy<16;gy++) for(let col=0;col<8;col++) setT(map,col,gy,2, 384+gy*8+col);
savePreview(map,TSID,'_build/atlas_castle.png',3);
for(let gy=0;gy<16;gy++){ let l='row'+gy+' (y'+gy+'): '; for(let col=0;col<8;col++) l+=(384+gy*8+col)+' '; console.error(l); }
