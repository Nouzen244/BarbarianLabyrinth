import { savePreview, fillLayer, setT } from './maplib.mjs';
// show C col0-1 (gx8-9), rows gy5..13 stacked, to read tower anatomy. id=384+gy*8+col
const TSID=2, W=4, H=9;
const map={width:W,height:H,tilesetId:TSID,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2816);
for(let r=0;r<9;r++) for(let c=0;c<2;c++) setT(map,1+c,r,2, 384+(5+r)*8+c);
savePreview(map,TSID,'_build/test_tower.png',4);
for(let r=0;r<9;r++) console.error('map row'+r+' = gy'+(5+r)+' ids '+(384+(5+r)*8)+','+(384+(5+r)*8+1));
