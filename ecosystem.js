const H = 600;
const W = 600;
const RAIN_BUTTON = document.getElementById('rain');
RAIN_BUTTON.onclick = stopStartRain;
let canRain = true;
let altMax = 255;
let lowestSpot = altMax;

let canvas = document.getElementById('canvas');
canvas.width = W;
canvas.height = H;
let ctx = canvas.getContext('2d');
let imageData = ctx.getImageData(0, 0, W, H);
let state = {
	map: new Uint8ClampedArray(W * H * 4)
};

function getAlt(i) {
	return state.map[i * 4];
}

function changeAlt(i, val) {
	state.map[i * 4 + 1] += val;
}

function getWater(i) {
	return state.map[i * 4 + 2];
}

function changeWater(i, val) {
	state.map[i * 4 + 3] += val;
}

function update(i) {
	if (state.map[i * 4 + 1] === 255) {
		state.map[i * 4] += 1;
		state.map[i * 4 + 1] = 128;
	}
	if (state.map[i * 4 + 1] === 0) {
		state.map[i * 4] -= 1;
		state.map[i * 4 + 1] = 128;
	}
	if (state.map[i * 4 + 3] !== 128) {
		state.map[i * 4 + 2] += (state.map[i * 4 + 3] - 128);
		state.map[i * 4 + 3] = 128;
	}
}

function draw(map) {
	for (let i = 0; i < W * H; i++) {
		let waterColor = getWater(i);
		if (waterColor > 0) {
			imageData.data[i * 4 + 0] = (255 - waterColor/2)/2;
			imageData.data[i * 4 + 1] = (255 - waterColor/2)/2;
			imageData.data[i * 4 + 2] = 255 - waterColor/2;
		} else {
			let altColor = getAlt(i);
			imageData.data[i * 4] = altColor;
			imageData.data[i * 4 + 1] = altColor;
			imageData.data[i * 4 + 2] = altColor;
		}
		imageData.data[i * 4 + 3] = 255
	}

	ctx.putImageData(imageData, 0, 0);
}

let cardinals = {
	SELF: {fromSelf: 0, leftNabe: null, rightNabe: null},
	N: {fromSelf: -W, leftNabe: -W+1, rightNabe: -W-1},
	S: {fromSelf: W, leftNabe: W-1, rightNabe: W+1},
	E: {fromSelf: 1, leftNabe: -W+1, rightNabe: W+1},
	W: {fromSelf: -1, leftNabe: W-1, rightNabe: -W-1},
	NW: {fromSelf: -W-1, leftNabe: -1, rightNabe: -W},
	NE: {fromSelf: -W+1, leftNabe: -W, rightNabe: 1},
	SE: {fromSelf: W+1, leftNabe: 1, rightNabe: W},
	SW: {fromSelf: W-1, leftNabe: W, rightNabe: -1}
}

function drain(map) {
	for (let i = 0; i < W * H + (W + 2); i++) {
		let thisWater = getWater(i);
		if (map[i] !== undefined && thisWater > 0) {
			let move = moveWater(i);

			if (move.dir === i) {
				//maybe we'll add altitude here...
				//changeAlt(i, 2);

			} else if (typeof(move.dir) === "string") {
				changeAlt(i, -24);
				changeWater(i, -move.amount);

			} else {
				changeWater(i, -move.amount);
				changeAlt(i, -18);
				changeWater(move.dir, move.amount);
				changeAlt(move.dir, 2);
				changeAlt(move.leftNabe, -12);
				changeAlt(move.rightNabe, -12);

			}
		}

		if (map[i - (W + 2)] !== undefined) {
			update(i - (W + 2));
		}
	}
};

function moveWater(i) {
	let r = Math.floor(i/W + 1);
	let c = i%W + 1;
	if (r === 1 || r === H || c === 1 || c === W) {
		return {amount: getWater(i), dir: getEdge(r, c)}
	}

	let lowestNeighbor = findLowestNeighbor(i);

	if (lowestNeighbor.drop > 4) {
		return {
			amount: lowestNeighbor.drop/2,
			dir: lowestNeighbor.index,
			leftNabe: lowestNeighbor.leftNabe,
			rightNabe: lowestNeighbor.rightNabe
		};
	} else {
		return {amount: 0, dir: i}
	}
}

function getEdge(r, c) {
	if (r === 1 && c === 1) return "NW";
	if (r === 1 && c === W) return "NE";
	if (r === H && c === 1) return "SW";
	if (r === H && c === W) return "SE";
	if (r === 1) return "N";
	if (r === H) return "S";
	if (c === 1) return "W";
	if (c === W) return "E";
}

function findLowestNeighbor(i) {
	let lowestD;
	let lowestH = Infinity;

	for (dir in cardinals) {
		let dirX = i + cardinals[dir].fromSelf;

		let thisDirectionHeight = getAlt(dirX) + getWater(dirX);
		if (thisDirectionHeight < lowestH) {
			lowestH = thisDirectionHeight;
			lowestD = dir;
		}
	}

	let drop = (getAlt(i) + getWater(i)) - lowestH;

	return {
		index: i + cardinals[lowestD].fromSelf,
		drop: drop,
		leftNabe: i + cardinals[lowestD].leftNabe,
		rightNabe: i + cardinals[lowestD].rightNabe
	};
}

function rain() {
	if (Math.random() > .92) {
		for (let i = 0; i < W * H / (W/2); i ++) {
			let randomSpot = Math.floor(Math.random() * W * H);
			changeWater(randomSpot, 30)
		}
	}
};

function stopStartRain() {
	canRain = !canRain;
	let p = document.getElementById("status");
	if (canRain) {
		RAIN_BUTTON.innerText = "stop rain";
		p.innerText = "raining randomly";
	} else {
		RAIN_BUTTON.innerText = "start rain";
		p.innerText = "not raining";
	}
}

for (let i = 0; i < H * W; i++) {
	let thisAlt = Math.floor(altMax * (1 - Math.random()/5));
	state.map[i * 4] = thisAlt;
	state.map[i * 4 + 1] = 128;
	state.map[i * 4 + 2] = 0;
	state.map[i * 4 + 3] = 128;
}

tick();

function tick() {
	drain(state.map);
	draw(state.map);
	if (canRain) rain();
	window.requestAnimationFrame(tick);
};

//window.setInterval(tick, 1000);
