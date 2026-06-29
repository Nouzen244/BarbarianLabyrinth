// Outside_B atlas with CORRECT MV ids. col = id%8 (+8 if id>=128); row = floor(id/8)%16
import { savePreview, fillLayer, setT } from './maplib.mjs';
const W=16,H=16,map={width:W,height:H,tilesetId:2,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2816);
for(let id=0;id<256;id++){ const col=(id<128? id%8 : 8+id%8); const row=Math.floor(id/8)%16; setT(map,col,row,2,id); }
savePreview(map,2,'_build/atlas_B2.png',2);
let s='';for(let row=0;row<16;row++){let l='r'+row+': ';for(let col=0;col<16;col++){const id=(col<8?col:128+(col-8))+row*8;l+=String(id).padStart(3)+' ';}s+=l+'\n';}
console.error(s);
