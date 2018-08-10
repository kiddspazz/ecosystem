const H = 600;
const W = 600;
const canvasCenter = {x: W/2, y: H/2};
let canvas = document.getElementById('canvas');
canvas.width = W;
canvas.height = H;
let ctx = canvas.getContext('2d');
let imageData = ctx.getImageData(0, 0, W, H);

let topo = new Array(H * W).fill({});
let needRain = true;

for (let i = 0; i < topo.length; i++) {
	topo[i] = {
		altitude: (1 - Math.random()/5),
		water: 0
	};
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
			imageData.data[i * 4] = Math.floor(color.b);
			imageData.data[i * 4 + 1] = Math.floor(color.g);
			imageData.data[i * 4 + 3] = 255;
		}
	}
   ctx.putImageData(imageData, 0, 0);
}

function findColor(altitude) {
	//colors from green to yellow to red as 0 --> 1
	if (altitude < .66) {
		return {b: 0, g: (altitude * 255)};
	}
	return {b: 0, g: (altitude * 255)};
}

function rain() {
	if (needRain) {
		topo.forEach(function(e, i) {
			if (Math.random() > .6) {
				e.water ++;
			}
		})
	} else if (Math.random() > .999) {
		console.log('It rained!');
		topo.forEach(function(e, i) {
			if (Math.random() > .8) {
				e.water ++;
			}
		});
	}
	needRain = true;
}

function drain() {
	let oldTopo = Array.from(Object.assign(topo));
	for (let i = 0; i < topo.length; i ++) {
		if (topo[i].water) {
			needRain = false;
			if (
				//is on the edge...
				i/W < 1 ||
				i/W > W - 1 ||
				i%W === 0 ||
				i%W === W -1
			) {
				topo[i].water = Math.max(0, topo[i].water - 1);
			} else {
				//n, ne, e, se, s, sw, w, nw
				let d = [
					i - W, i - W + 1, i + 1, i + W + 1, i + W, i + W - 1, i - 1, i - W - 1, i
				];
				moveTo = findLowerGround(i, d);
				if (moveTo === 8) {
					topo[i].water -= .2;
				} else {
					topo[d[moveTo]].water += topo[i].water;
					topo[i].water = 0;
					topo[i].altitude -= .001;
				};
			};
		};
	};

	function findLowerGround(i, d) {
		let neighbors = [
			oldTopo[d[0]].altitude + oldTopo[d[0]].water/12,
			oldTopo[d[1]].altitude + oldTopo[d[1]].water/12,
			oldTopo[d[2]].altitude + oldTopo[d[2]].water/12,
			oldTopo[d[3]].altitude + oldTopo[d[3]].water/12,
			oldTopo[d[4]].altitude + oldTopo[d[4]].water/12,
			oldTopo[d[5]].altitude + oldTopo[d[5]].water/12,
			oldTopo[d[6]].altitude + oldTopo[d[6]].water/12,
			oldTopo[d[7]].altitude + oldTopo[d[7]].water/12,
			oldTopo[d[8]].altitude + oldTopo[d[8]].water/12
		]
		let lowest = 0;
		for (let j = 0; j < neighbors.length; j ++) {
			if (neighbors[j] < neighbors[lowest]) {lowest = j}
		}
		return (lowest);
	}
}

function tick() {
	drain();
	topo.draw();
	rain();
};

tick();
//window.setInterval(tick, 80);
