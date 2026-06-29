// Dungeon wall autotiles kinds 80..111 (A4). Draw a small wall box per kind.
import { savePreview, fillLayer, wallRect } from './maplib.mjs';
const A2=k=>2048+k*48;
const cols=8, rows=4, cell=4, W=cols*cell, H=rows*cell;
const map={width:W,height:H,tilesetId:4,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,A2(17));
for(let i=0;i<32;i++){ const k=80+i, c=i%cols, r=Math.floor(i/cols); wallRect(map, c*cell, r*cell, 3,3, k, 1); }
savePreview(map,4,'_build/palette_wall.png',3);
let s='';for(let r=0;r<rows;r++){let l='';for(let c=0;c<cols;c++)l+=String(80+r*cols+c).padStart(3)+' ';s+=l+'\n';}console.error(s);
