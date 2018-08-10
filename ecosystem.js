const H = 600;
const W = 600;
const canvasCenter = {x: W/2, y: H/2};
let canvas = document.getElementById('canvas');
canvas.width = W;
canvas.height = H;
let ctx = canvas.getContext('2d');
let imageData = ctx.getImageData(0, 0, W, H);

let topo = new Array(H * W).fill({});

for (let i = 0; i < topo.length; i++) {
	topo[i] = {
		altitude: (1 - Math.random()/5),
		water: 0
	}
}

topo.draw = function() {
	for (let i = 0; i < topo.length; i++) {
		if (topo[i].water) {
			imageData.data[i * 4] = 0;
			imageData.data[i * 4 + 1] = Math.max(0, (2 - topo[i].water/10)) * 125/2;
			imageData.data[i * 4 + 2] = Math.max(0, (2 - topo[i].water/10)) * 125;
			imageData.data[i * 4 + 3] = 255;
		} else {
			let color = findColor(topo[i].altitude);
			imageData.data[i * 4] = Math.floor(color.r);
			imageData.data[i * 4 + 1] = Math.floor(color.g);
			imageData.data[i * 4 + 3] = 255;
		}
	}
   ctx.putImageData(imageData, 0, 0);
}

function findColor(altitude) {
	//colors from green to yellow to red as 0 --> 1
	if (altitude < .33) {
		return {r: 0, g: ((altitude/.35) * 200)};
	}
	if (altitude < .66) {
		return {r: ((altitude - .33)/.33 * 255), g: ((altitude/.35) * 200)};
	}
	return {r: 255, g: ((1 - altitude)/.33 * 255)};
}

function rain() {
	if (Math.random() > .97) {
		console.log('It rained!');
		topo.forEach(function(e, i) {
			if (Math.random() > .8) {
				e.water ++;
			}
		});
	}
}

function drain() {
	let oldWater = topo;
	for (let i = 0; i < oldWater.length; i ++) {
		if (oldWater[i].water) {
			//n, ne, e, se, s, sw, w, nw
			let d = [
				i - W, i - W + 1, i + 1, i + W + 1, i + W, i + W - 1, i - 1, i - W - 1, i
			];
			moveTo = findLowerGround(i, d);
			if (!moveTo) {
				topo[i].water = 0
			} else if (moveTo === 8) {
				topo[i].water -= .02;
			} else {
				topo[i].water -= 1;
				topo[i].altitude -= .01;
				topo[d[moveTo]].water ++;
			}
		}
	}

	function findLowerGround(pixel, d) {
		if (
			pixel/W < 1 ||
			pixel/W > W - 1 ||
			pixel%W === 0 ||
			pixel%W === W -1
		) {
			return false;
		}
		let neighbors = [
			oldWater[d[0]].altitude + oldWater[d[0]].water/5,
			oldWater[d[1]].altitude + oldWater[d[1]].water/5,
			oldWater[d[2]].altitude + oldWater[d[2]].water/5,
			oldWater[d[3]].altitude + oldWater[d[3]].water/5,
			oldWater[d[4]].altitude + oldWater[d[4]].water/5,
			oldWater[d[5]].altitude + oldWater[d[5]].water/5,
			oldWater[d[6]].altitude + oldWater[d[6]].water/5,
			oldWater[d[7]].altitude + oldWater[d[7]].water/5,
			oldWater[d[8]].altitude + oldWater[d[8]].water/5
		]
		let lowest = 0;
		for (let j = 0; j < neighbors.length; j ++) {
			if (neighbors[j] < neighbors[lowest]) {lowest = j}
		}
		return (lowest);
	}
}

function tick() {
	let now = new Date();
	drain();
	topo.draw();
	rain();
	console.log("it took " + (new Date() - now) + " ms to compute");
};

tick();
//window.setInterval(tick, 100);
