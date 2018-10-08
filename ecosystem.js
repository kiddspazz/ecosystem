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

function setAlt(i, val) {
	state.map[i * 4] = val
}

function getWater(i) {
	return state.map[i * 4 + 2];
}

function setWater(i, val) {
	state.map[i * 4 + 2] = val;
}

function draw(map) {
	for (let i = 0; i < W * H; i++) {
		let newWater = self.water + self.waterChange;
		let newAlt = self.alt + self.altChange;
		let color = findColor(newWater, newAlt);
		imageData.data[i * 4] = color.r;
		imageData.data[i * 4 + 1] = color.g;
		imageData.data[i * 4 + 2] = color.b;
		imageData.data[i * 4 + 3] = 255
		self.needsDraw = false;
	}

	ctx.putImageData(imageData, 0, 0);
}

function findColor(w, a) {
	//returns a color based on altitude (0-255), low being green, going through yellow, red, then white
	let color = {r: 0, g: 0, b: 0}
	if (w > 0) {
		color.b = Math.max(255 - w, 100);
	} else {
		let altStep = altMax/5
		if (a < altStep) {
			color.g = (a/altStep * 155 + 100);
		} else if (a < altStep*2) {
			color.r = ((a - altStep)/altStep * 255);
			color.g = (255);
		} else if (a < altStep*3) {
			color.r = ((-(a - altStep*3)/altStep * 100 + 155));
			color.g = (-(a - altStep*3)/altStep * 255);
		} else if (a < altStep*4) {
			color.r = 155;
			color.b = ((a - altStep*3)/altStep * 155);
		} else {
			color.r = 155;
			color.g = ((a - altStep*4)/altStep * 155);
			color.b = 155;
		}
	}
	return color;
};

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
	for (let i = 0; i < W * H; i++) {
		let self = map[i];
		if (self.alt < state.map[lowestSpot].alt) {
			lowestSpot = i;
		};
		if (self.needsUpdate) {
			self.needsUpdate = false;
			if (self.altChange + self.waterChange !== 0) {
				self.alt = Math.max(self.alt + self.altChange, 0);
				self.altChange = 0;
				self.water = Math.max(self.water + self.waterChange, 0);
				self.waterChange = 0;
			}
		}

		if (self.water > 0) {
			let move = moveWater(self, i);

			if (move.dir === i) {
				//self.altChange += Math.min(.01, altMax - self.alt);
			}

			else if (typeof(move.dir) === "string") {
				self.altChange -= Math.min(self.alt, 2);
				self.waterChange -= move.amount;
				self.needsDraw = true;
			}

			else {
				actualMoveAmount = Math.min(move.amount, self.water)
				self.waterChange -= actualMoveAmount;
				self.altChange -= Math.min(1, altMax - self.alt);
				self.needsDraw = true;
				let lowerSpot = state.map[move.dir]
				lowerSpot.waterChange += actualMoveAmount;
				lowerSpot.altChange += Math.min(.4, altMax - lowerSpot.alt)
				lowerSpot.needsDraw = true;
				let nabe1 = state.map[move.leftNabe];
				nabe1.altChange -= Math.min(.3, altMax - nabe1.alt);
				nabe1.needsDraw = true;
				let nabe2 = state.map[move.rightNabe];
				nabe2.altChange -= Math.min(.3, altMax - nabe2.alt);
				nabe2.needsDraw = true;
			}
		}
	}
};

function moveWater(self, i) {
	let r = Math.floor(i/W + 1);
	let c = i%W + 1;
	if (r === 1 || r === H || c === 1 || c === W) {
		return {amount: self.water, dir: getEdge(r, c)}
	}

	let lowestNeighbor = findLowestNeighbor(self, i);

	if (lowestNeighbor.drop > 7) {
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

function findLowestNeighbor(self, i) {
	let lowestD;
	let lowestH = Infinity;

	for (dir in cardinals) {
		let dirX = state.map[i + cardinals[dir].fromSelf];
		if (dirX.needsUpdate) {
			dirX.needsUpdate = false;
			if (dirX.altChange + dirX.waterChange !== 0) {
				dirX.alt = Math.max(0, dirX.alt + dirX.altChange);
				dirX.altChange = 0;
				dirX.water = Math.max(0, dirX.water + dirX.waterChange);
				dirX.waterChange = 0;
			}
		}


		let thisDirectionHeight = dirX.alt + dirX.water;
		if (thisDirectionHeight < lowestH) {
			lowestH = thisDirectionHeight;
			lowestD = dir;
		}
	}

	let drop = (self.alt + self.water) - lowestH;

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
			state.map[randomSpot].water += 30;
			state.map[randomSpot].needsDraw = true;
			state.map[randomSpot].needsUpdate = true;
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
	let thisAlt = Math.floor(altMax * (1 - Math.random()/10));
	state.map[i] = {
		alt: thisAlt,
		water: 0,
		altChange: 0,
		waterChange: 0,
		needsUpdate: true,
		needsDraw: true
	}
}

tick();

function tick() {
	draw(state.map)
	drain(state.map);
	if (canRain) rain();
	window.requestAnimationFrame(tick);
};

//window.setInterval(tick, 1000);
