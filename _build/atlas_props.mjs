// zoom: Outside_B props area — right half lower rows (lamps/wells/benches). scale 5
import { savePreview, fillLayer, setT } from './maplib.mjs';
const cols=[...Array(16).keys()], rows=[...Array(16).keys()];
const W=16,H=16,map={width:W,height:H,tilesetId:2,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2816);
// place each id at its grid cell, but render a window later by cropping mentally
for(const row of rows) for(const col of cols){ const id=(col<8?col:128+(col-8))+row*8; setT(map,col,row,2,id); }
// re-render just columns 8-15 rows 9-15 big by building a small map
const W2=8,H2=7,m2={width:W2,height:H2,tilesetId:2,data:new Array(W2*H2*6).fill(0)};
fillLayer(m2,0,2816);
for(let r=0;r<7;r++)for(let c=0;c<8;c++){ const col=8+c, row=9+r; const id=128+(col-8)+row*8; setT(m2,c,r,2,id); }
savePreview(m2,2,'_build/atlas_props.png',5);
let s='';for(let r=0;r<7;r++){let l='row'+(9+r)+': ';for(let c=0;c<8;c++){const id=128+c+(9+r)*8;l+=String(id).padStart(3)+' ';}s+=l+'\n';}
console.error(s);
