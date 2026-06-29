import { savePreview, fillLayer, wallRect, fillRect } from './maplib.mjs';
const TSID=4, W=15, H=10;
const map={width:W,height:H,tilesetId:TSID,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2048+16*48);          // floor: A2 kind16 (sandstone)
// outer wall border via A4 kind81 (grey stone), wallRect on layer1
wallRect(map,0,0,W,1,81,1);            // top wall row
wallRect(map,0,H-1,W,1,81,1);          // bottom
wallRect(map,0,0,1,H,81,1);            // left
wallRect(map,W-1,0,1,H,81,1);          // right
// an interior wall chunk
wallRect(map,6,3,3,3,81,1);
savePreview(map,TSID,'_build/test_dungeon.png',2);
console.error('rendered test_dungeon.png');
