// Atlas of the Inside tileset (id 3): A2 floors, A4 walls, B furniture.
import { savePreview, fillLayer, setT } from './maplib.mjs';
const TSID = 3;
function mk(W, H){ const data=new Array(W*H*6).fill(0); return {data,map:()=>({width:W,height:H,tilesetId:TSID,data})}; }
const bid=(gx,gy)=> gx<8 ? gy*8+gx : 128+gy*8+(gx-8);

// A2 floors (kinds 16-31) + A4 walls (kinds 80-95), shape0
{ const W=8,H=5,o=mk(W,H);
  for(let i=0;i<16;i++) o.data[(0*H+Math.floor(i/8))*W + i%8] = 2048+(16+i)*48;       // A2
  for(let i=0;i<16;i++) o.data[(0*H+3+Math.floor(i/8))*W + i%8] = 2048+(80+i)*48;      // A4
  savePreview(o.map(), TSID, '_build/atlas_in_fw.png', 3);
}
// B furniture/objects 16x16 over a floor bg
{ const W=16,H=16,o=mk(W,H); const m=o.map();
  fillLayer(m,0,2816);
  for(let gy=0;gy<16;gy++)for(let gx=0;gx<16;gx++) setT(m,gx,gy,2, bid(gx,gy));
  savePreview(m, TSID, '_build/atlas_in_B.png', 2);
}
console.error('atlas_in_fw.png (A2 floors rows0-1 kinds16-31, A4 walls rows3-4 kinds80-95); atlas_in_B.png (B furniture)');
