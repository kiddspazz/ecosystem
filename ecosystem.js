const H = 400;
const W = 400;
const canvasCenter = {x: W/2, y: H/2};
let canvas = document.getElementById('canvas');
canvas.width = W;
canvas.height = H;
let ctx = canvas.getContext('2d');
let imageData = ctx.getImageData(0, 0, W, H);

let topo = new Array(H * W).fill({});
let needRain = true;

let highest = 0;
let mostWater = 0;

for (let i = 0; i < topo.length; i++) {
	topo[i] = {
		// altitude 0 - 1
		altitude: findAltitude(i),
		water: 0
	};
}

topo.draw = function() {
	for (let i = 0; i < topo.length; i++) {
		if (i === highest) {
			imageData.data[i * 4] = 255;
			imageData.data[i * 4 + 1] = 255;
			imageData.data[i * 4 + 2] = 255;
			imageData.data[i * 4 + 3] = 255;
		} else if (i === mostWater) {
			imageData.data[i * 4] = 0;
			imageData.data[i * 4 + 1] = 0;
			imageData.data[i * 4 + 2] = 0;
			imageData.data[i * 4 + 3] = 255;
		} else if (topo[i].water > .001) {
			imageData.data[i * 4] = 0;
			imageData.data[i * 4 + 1] = 0;
			imageData.data[i * 4 + 2] = Math.ceil((1 - (topo[i].water/.05)) * 155 + 100);
			imageData.data[i * 4 + 3] = 150;
		} else {
			let color = findColor(topo[i].altitude);
			imageData.data[i * 4] = Math.floor(color.r);
			imageData.data[i * 4 + 1] = Math.floor(color.g);
			imageData.data[i * 4 + 2] = Math.floor(color.b);
			imageData.data[i * 4 + 3] = 255;
		}
	}

   ctx.putImageData(imageData, 0, 0);
}

function findColor(a) {
	let color = {r: 0, g: 0, b: 0}
	if (a < .2) {
		color.g = (a/.2 * 155 + 100);
	} else if (a < .4) {
		color.r = ((a - .2)/.2 * 255);
		color.g = (255);
	} else if (a < .6) {
		color.r = ((-(a - .6)/.2 * 100 + 155));
		color.g = (-(a - .6)/.2 * 255);
	} else if (a < .8) {
		color.r = 155;
		color.b = ((a - .6)/.2 * 155);
	} else {
		color.r = 155;
		color.g = ((a - .8)/.2 * 155);
		color.b = 155;
	}
	return color;
}

function rain() {
	if (needRain || Math.random() > .999) {
		console.log('It rained!');
		topo.forEach(function(e) {
			if (Math.random() > .5 && e.water < 1) {
				e.water += .05;
			}
		})
	}

	needRain = true;
}

function drain() {
	let oldTopo = Array.from(Object.assign(topo));
	for (let i = 0; i < topo.length; i ++) {
		if (topo[i].water > topo[mostWater].water) {mostWater = i};
		if (topo[i].altitude > topo[highest].altitude) {highest = i};
		topo[i].water = Math.max(topo[i].water - .00001, 0);
		if (topo[i].water) {
			needRain = false;
			if (
				//is on the edge...
				i/W < 1 ||
				i/W > W - 1 ||
				i%W === 0 ||
				i%W === W - 1
			) {
				if (topo[i].altitude > 0) {
					topo[i].altitude = Math.max(0, topo[i].altitude - topo[i].water);
				}
				topo[i].water = 0;

			} else {
				//n, ne, e, se, s, sw, w, nw
				let cardinals = [
					i - W, i - W + 1, i + 1, i + W + 1, i + W, i + W - 1, i - 1, i - W - 1
				];
				let downhill = cardinals[biggestDrop(i, cardinals)];
				let drop = (
					(oldTopo[i].altitude + oldTopo[i].water) -
					(oldTopo[downhill].altitude + oldTopo[downhill].water)
				);

				if (drop > 0) {
					let waterTransfer = Math.min(drop/2, topo[i].water);
					topo[downhill].water += waterTransfer;
					topo[i].water -= waterTransfer;
					if (topo[i].altitude > 0) {
						topo[i].altitude -= (.5 * waterTransfer)
					};
					if (topo[downhill].altitude < 1) {
						topo[downhill].altitude = Math.min(
							1, topo[downhill].altitude + (.3 * waterTransfer)
					)};

				}
			};
		};
	};

	function biggestDrop(i, d) {
		let start = oldTopo[i].altitude + oldTopo[i].water;
		let neighbors = [];
		for (let nabenum = 0; nabenum < 8; nabenum ++) {
			neighbors[nabenum] = (
				start - (oldTopo[d[nabenum]].altitude + oldTopo[d[nabenum]].water)
			)
		}
		let biggestDrop = 0;
		for (let j = 0; j < neighbors.length; j ++) {
			if (neighbors[j] > neighbors[biggestDrop]) {biggestDrop = j}
		}
		return (biggestDrop);
	}
}

function findAltitude(i) {
	let centeredW = Math.abs(W/2 - (Math.abs(i % W - W)));
	let centeredH = Math.abs(H/2 - (Math.abs(Math.floor(i / W) - H)));
	let max = (W/2) + (H/2);
	let distFromCent = 1 - (max - (centeredW + centeredH))/max;
	let thisAltitude = (1 - distFromCent/4.5 * (1 - Math.random()/5));
	return thisAltitude;
}

function tick() {
//	let now = new Date();
	drain();
	topo.draw();
	rain();
/*	if (new Date() - now > 30) {
		console.log(new Date() - now);
		console.log(`highest: ${highest}: `);
		console.log(topo[highest]);
		console.log(`mostWater: ${mostWater}: `);
		console.log(topo[mostWater]);
	}
	*/
};

tick();
window.setInterval(tick, 20);
