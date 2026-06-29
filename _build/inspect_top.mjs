// render specific Outside_C tiles big to identify skeletons vs banners
import { savePreview, fillLayer, setT } from './maplib.mjs';
const ids=[256,257,264,265,266,267,268,280,281,282,283,288,289,290,291,432];
const W=ids.length,H=2;
const map={width:W,height:H,tilesetId:2,data:new Array(W*H*6).fill(0)};
fillLayer(map,0,2816);
ids.forEach((id,i)=>setT(map,i,1,2,id));
savePreview(map,2,'_build/inspect_top.png',4);
console.error('ids:', ids.join(' '));
