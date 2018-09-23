const H = 600;
const W = 600;
const RAIN_BUTTON = document.getElementById('rain');
RAIN_BUTTON.onclick = stopStartRain;
let canRain = true;

let canvas = document.getElementById('canvas');
canvas.width = W;
canvas.height = H;
let ctx = canvas.getContext('2d');
let imageData = ctx.getImageData(0, 0, W, H);
let state = {
	map: new Uint8ClampedArray(2 * W * H)
};

function draw(map) {
	for (let i = 0; i < map.length/2; i++) {
		if (hasWater(i * 2 + 1)) {
			imageData.data[i * 4] = 0;
			imageData.data[i * 4 + 1] = 0;
			imageData.data[i * 4 + 2] = Math.max(
				Math.ceil(map[i * 2 + 1]), 150
			);
		} else {
			let color = findColor(map[i * 2]/255);
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
	let newMap = new Uint8ClampedArray(2 * W * H)

	for (let i = 0; i < map.length/2; i++) {
		//i * 2 === altitude, i * 2 + 1 === water
		newMap[i * 2] += map[i * 2];
		newMap[i * 2 + 1] += map[i * 2 + 1];

		if (hasWater(i * 2 + 1)) {
			let move = moveWater(i, map);

			if (move.dir === i) {
				//if this location is lower than all around it -- dirt settles (altitude increases)
				newMap[i * 2] += 1;
				newMap[i * 2 + 1] -= 1;
				continue
			}

			if (typeof(move.dir) === "string") {
				//move water out of current location
				newMap[i * 2 + 1] -= 1;
				//erode current location
				newMap[i * 2] -= 1;
			}

			if (typeof(move.dir) === "number") {
				//move water out of current location
				newMap[i * 2 + 1] -= move.amount;
				//erode current location
				newMap[i * 2] -= 1;
				//move water to downhill location
				newMap[move.dir * 2 + 1] += move.amount;
				//move a little dirt to downhill location
			}
		}
	}

	return newMap;
};

function hasWater(i) {
	if (state.map[i] > 0) return true
	return false;
}

function moveWater(i, map) {
	let onEdge = getEdgeCondition(i);
	if (onEdge) {
		return {amount: map[i * 2 + 1], dir: onEdge}
	}

	let lowestNeighbor = findLowestNeighbor(i, map);
	//lowestNeighbor = {direction: index, altitudeDelta: 0-255}

	return {
		amount: Math.min(map[i * 2 + 1], Math.floor(lowestNeighbor.drop/2)),
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
	let startHeight = map[i * 2] + map[i * 2 + 1];
	let biggestDrop = 0;
	let lowestDirection = i;

	for (let j = 0; j < cardinals.length; j++) {
		let thisDirectionHeight = map[cardinals[j] * 2] + map[cardinals[j] * 2 + 1]
		let currentDrop = startHeight - thisDirectionHeight;
		if (currentDrop > biggestDrop) {
			biggestDrop = currentDrop;
			lowestDirection = cardinals[j];
		}
	}

	return {index: lowestDirection, drop: biggestDrop};
}

function rain() {
	for (let i = 0; i < state.map.length; i ++) {
		if (isLucky()) {
			state.map[i * 2 + 1] += 40;
		}
	}
	return false;
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

function isLucky() {
	if (Math.random() > .95) return true
	return false;
}

for (let i = 0; i < H * W; i++) {
	state.map[i * 2] = 255 * (1 - Math.random()/10)
}

tick();

function tick() {
	draw(state.map);
	update(state.map);
	if (Math.random() > .91 && canRain) rain();
	window.requestAnimationFrame(tick);
};
