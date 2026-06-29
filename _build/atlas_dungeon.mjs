// Dungeon tileset (id 4): A2 floors (kinds 16-31) + A4 walls (kinds 80-95).
import { savePreview } from './maplib.mjs';
const TSID=4, W=8, H=5;
const data=new Array(W*H*6).fill(0);
for(let i=0;i<16;i++) data[(0*H+Math.floor(i/8))*W + i%8] = 2048+(16+i)*48;     // A2 floors
for(let i=0;i<16;i++) data[(0*H+3+Math.floor(i/8))*W + i%8] = 2048+(80+i)*48;    // A4 walls
savePreview({width:W,height:H,tilesetId:TSID,data}, TSID, '_build/atlas_dungeon.png', 3);
console.error('atlas_dungeon.png: rows0-1 A2 floors kinds16-31; rows3-4 A4 walls kinds80-95');
