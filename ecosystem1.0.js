const H = 600;
const W = 600;
const RAIN_BUTTON = document.getElementById('rain');
RAIN_BUTTON.onclick = rain;

let canvas = document.getElementById('canvas');
canvas.width = W;
canvas.height = H;
let ctx = canvas.getContext('2d');
let imageData = ctx.getImageData(0, 0, W, H);
let state = {
	map: {
		altitude: [],
		water: []
	}
};

function draw(map) {
	for (let i = 0; i < map.altitude.length; i++) {
		if (hasWater(i)) {
			imageData.data[i * 4] = 0;
			imageData.data[i * 4 + 1] = 0;
			imageData.data[i * 4 + 2] = Math.max(
				Math.ceil(map.water[i]), 150
			);
		} else {
			let color = findColor(map.altitude[i]/255);
			imageData.data[i * 4] = Math.floor(color.r);
			imageData.data[i * 4 + 1] = Math.floor(color.g);
			imageData.data[i * 4 + 2] = Math.floor(color.b);
		}
		imageData.data[i * 4 + 3] = 255;
	}

	ctx.putImageData(imageData, 0, 0);

}

function findColor(a) {
	//returns a color based on altitude (0-1), low being green, going through yellow, red, then white
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
};

function update(map) {
	state.map = drain(map);
}

function drain(map) {
	let newMap = { altitude: [], water: [] };

	for (let i = 0; i < map.altitude.length; i++) {
		if (typeof(newMap.altitude[i]) !== "number") {
			newMap.altitude[i] = map.altitude[i];
			newMap.water[i] = map.water[i];
		}

		if (hasWater(i)) {
			let move = moveWater(i, map);

			if (move.dir === i) {
				//if this location is lower than all around it -- dirt settles (altitude increases)
				newMap.altitude[i] += Math.floor(.01 * map.water[i]);
				continue
			}

			//move water out of current location
			newMap.water[i] -= move.amount;
			//erode current location
			newMap.altitude[i] = Math.max(
				newMap.altitude[i] - Math.floor(move.amount * .08), 0
			);

			if (typeof(move.dir) === "number" && move.amount > 0) {
				if (typeof(newMap.altitude[move.dir]) !== "number") {
					newMap.altitude[move.dir] = map.altitude[move.dir];
					newMap.water[move.dir] = map.water[move.dir];
				}
				//move water to downhill location
				newMap.water[move.dir] += move.amount;
				//move a little dirt to downhill location
				newMap.altitude[move.dir] += Math.floor(move.amount * .08);
			}
		}
		if (isLucky()) newMap.water[i] = Math.max(0, newMap.water[i] - 1)
	}

	return newMap;
};

function hasWater(i) {
	if (state.map.water[i] > 1) return true
	return false;
}

function moveWater(i, map) {
	let onEdge = getEdgeCondition(i);
	if (onEdge) {
		return {amount: map.water[i]}
	}

	let lowestNeighbor = findLowestNeighbor(i, map);
	//lowestNeighbor = {direction: index, altitudeDelta: 0-255}

	return {
		amount: Math.min(map.water[i], Math.floor(lowestNeighbor.drop/2)),
		dir: lowestNeighbor.index
	};
}

function getEdgeCondition(index) {
	let row = Math.ceil(index/W);
	let column = index%W + 1;

	if (row === 1 && column === 1) return "NW"
	if (row === 1 && column === W) return "NE"
	if (row === H && column === 1) return "SW"
	if (row === H && column === W) return "SE"
	if (row === 1) return "N"
	if (row === H) return "S"
	if (column === 1) return "W"
	if (column === W) return "E"

	return false;
}

function findLowestNeighbor(i, map) {
	let cardinals = [
		i - W,
		i - W + 1,
		i + 1,
		i + W + 1,
		i + W,
		i + W - 1,
		i - 1,
		i - W - 1
	];
	let startHeight = map.altitude[i] + map.water[i];
	let biggestDrop = 0;
	let lowestDirection = i;

	for (let j = 0; j < cardinals.length; j++) {
		let thisDirectionHeight = map.altitude[cardinals[j]] + map.water[cardinals[j]]
		let currentDrop = startHeight - thisDirectionHeight;
		if (currentDrop > biggestDrop) {
			biggestDrop = currentDrop;
			lowestDirection = cardinals[j];
		}
	}

	return {index: lowestDirection, drop: biggestDrop};
}

function rain() {
	for (let i = 0; i < state.map.water.length; i ++) {
		if (isLucky() && notFull(i)) {
			state.map.water[i] += 40;
		}
	}
	return false;
};

function isLucky() {
	if (Math.random() > .95) return true
	return false;
}

function notFull(i) {
	if (state.map.water[i] < 256) return true
	return false;
}

for (let i = 0; i < H * W; i++) {
	state.map.altitude[i] = Math.floor(255 * (1 - Math.random()/10))
	state.map.water[i] = 0;
}

tick();

function tick() {
	draw(state.map);
	update(state.map);
	window.requestAnimationFrame(tick);
};
