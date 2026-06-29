// Dungeon floor autotiles kinds 0..47 (A1 lava/water 0-15, A2 floors 16-47)
import { savePreview, fillLayer, fillRect } from './maplib.mjs';
const A2=k=>2048+k*48;
const cols=8, rows=6, cell=4, W=cols*cell, H=rows*cell;
const map={width:W,height:H,tilesetId:4,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,A2(16));
for(let k=0;k<48;k++){ const c=k%cols, r=Math.floor(k/cols); fillRect(map, c*cell, r*cell, 3,3, 0, A2(k)); }
savePreview(map,4,'_build/palette_floor.png',3);
let s='';for(let r=0;r<rows;r++){let l='';for(let c=0;c<cols;c++)l+=String(r*cols+c).padStart(3)+' ';s+=l+'\n';}console.error(s);
