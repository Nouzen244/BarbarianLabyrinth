import { savePreview, fillLayer, fillRect, wallRect } from './maplib.mjs';
const TSID = 2, W = 16, H = 10;
const map = { width: W, height: H, tilesetId: TSID, data: new Array(W*H*6).fill(0) };
fillLayer(map, 0, 2816);              // grass everywhere (A2 kind16 shape0)
fillRect(map, 1, 6, 6, 3, 0, 1576);   // candidate cobblestone (A5 row5)
fillRect(map, 8, 6, 6, 3, 0, 1584);   // candidate cobblestone round (A5 row6)
// A3 building blocks (kind = roof/building material), auto-shaped
wallRect(map, 1, 1, 4, 3, 53, 1);     // kind 53
wallRect(map, 6, 1, 5, 4, 48, 1);     // kind 48
wallRect(map, 12, 1, 3, 3, 61, 1);    // kind 61
savePreview(map, TSID, '_build/test_build.png', 2);
console.error('rendered test_build.png');
