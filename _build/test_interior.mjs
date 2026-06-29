import { savePreview, fillLayer, fillRect, setT } from './maplib.mjs';
const TSID=3, W=13, H=9;
const map={width:W,height:H,tilesetId:TSID,data:new Array(W*H*6).fill(0)};
const A2=(k)=>2048+k*48; // shape0
fillLayer(map,0,A2(16));                 // wood floor (kind16)
// brick "walls": top 2 rows + 1-row border sides/bottom (A2 kind26 brown brick)
fillRect(map,0,0,W,2,0,A2(26));
fillRect(map,0,0,1,H,0,A2(26)); fillRect(map,W-1,0,1,H,0,A2(26)); fillRect(map,0,H-1,W,1,0,A2(26));
// counter (B furniture row gy3 -> id 24..27) on layer2, around y3
for(let i=0;i<5;i++) setT(map,4+i,3,2, 24+i);
// some shelves behind counter (B gy4 -> 32..)
for(let i=0;i<5;i++) setT(map,4+i,2,2, 32+i);
savePreview(map,TSID,'_build/test_interior.png',2);
console.error('rendered test_interior.png');
