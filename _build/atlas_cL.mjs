// Outside_C LEFT half (gx0-7): fountains, banners, statues. id = 256 + gy*8 + gx
import { savePreview, fillLayer, setT } from './maplib.mjs';
const TSID=2, W=8, H=16;
const map={width:W,height:H,tilesetId:TSID,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2816);
for(let gy=0;gy<16;gy++) for(let gx=0;gx<8;gx++) setT(map,gx,gy,2, 256+gy*8+gx);
savePreview(map,TSID,'_build/atlas_cL.png',3);
for(let gy=0;gy<16;gy++){let l='row'+gy+': '; for(let gx=0;gx<8;gx++) l+=(256+gy*8+gx)+' '; console.error(l);}
