const H = 600;
const W = 600;
const canvasCenter = {x: W/2, y: H/2};
let canvas = document.getElementById('canvas');
canvas.width = W;
canvas.height = H;
let ctx = canvas.getContext('2d');
let imageData = ctx.getImageData(0, 0, W, H);

let topo = new Array(H * W).fill(0);

topo.draw = function() {
	let now = new Date();
	for (e in topo) {
		let rand = 1 - Math.floor(Math.random() * 5)/100;
		topo[e] = rand;
		let color = findColor(topo[e]);
		imageData.data[e * 4] = color.r;
		imageData.data[e * 4 + 1] = color.g;
		imageData.data[e * 4 + 3] = 255;
	}
   ctx.putImageData(imageData, 0, 0);
	console.log((new Date()) - now);
}

topo.draw();

function findColor(topo) {
	//colors from green to yellow to red as 0 --> 1
	if (topo < .33) {
		return {r: 0, g: ((topo/.35) * 200)};
	}
	if (topo < .66) {
		return {r: ((topo - .33)/.33 * 255), g: ((topo/.35) * 200)};
	}
	return {r: 255, g: ((1 - topo)/.33 * 255)};
}
