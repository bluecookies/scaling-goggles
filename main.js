//todo: fix up sprites
//add gaussian?
//cosine distance
//arbitrary stat names
//gen2
//probably gen3
//maybe gen4

var som = {
	width: 60,
	height: 60,
	gm: 60,
	gridWidth: 600/this.width,
	gridHeight: 600/this.height,
	weights: [],
	similarity: [],
	
	decayRate: 1/1000,
	learnRate: 1
};

var canvas, ctx;
var sprites = [];

window.onload = function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	ctx.fillStyle = "#CC7711";
	ctx.fillRect(0, 0, 640, 640);
	ctx.fillStyle = "silver";
	ctx.fillRect(640, 0, 200, 640);
	
	pokemonData = JSON.parse(pokemonData);
	pokemonDataII = JSON.parse(pokemonDataII);
	pokemonData.push.apply(pokemonData, pokemonDataII);
	renameStats(pokemonData);	
	
	document.getElementById("networkWidth").addEventListener("change", calculateDefault);
	document.getElementById("networkHeight").addEventListener("change", calculateDefault);
	document.getElementById("trainButton").addEventListener("click", trainButtonClick);
	canvas.addEventListener("mousemove", canvasMouseMove);
};

//HP, Attack, Defense, SpAttack, SpDef, Speed
function Node(x, y) {
	return {
		x: x,
		y: y,
		hp: (Math.random() * Node["hpRange"] + Node["hpMin"]), 
		atk: (Math.random() * Node["atkRange"] + Node["atkMin"]), 
		def: (Math.random() * Node["defRange"] + Node["defMin"]),
		spAtk: (Math.random() * Node["spAtkRange"] + Node["spAtkMin"]),
		spDef: (Math.random() * Node["spDefRange"] + Node["spDefMin"]),
		spd: (Math.random() * Node["spdRange"] + Node["spdMin"])};
};	//non normalized

function trainNetwork(data) {
	var neighbourhood2 = som.width * som.height; //Math.max(som.width, som.height);
	
	
	var network = [];
	initWeights(network);	//randomize weights in map
	
	var inputVector, weight;
	var d2, minDist2;
	var minX, minY;
	var BMU;
	var strength;
	//Todo: Add convergence criterion (delta weight < threshold)
	while (neighbourhood2 > 1) {
		inputVector = data[Math.floor(Math.random() * data.length)];
		//find best fit (euclidian) (maybe try cosine distance)
		minDist2 = Infinity;
		for (var i = 0; i < som.width; i++) {
			for (var j = 0; j < som.height; j++) {
				weight = network[i][j];
				d2 = dist(weight, inputVector);
				if (d2 < minDist2) {
					minDist2 = d2;
					minX = i;
					minY = j;
				}
			}
		}
		BMU = network[minX][minY];
		//adjust each weight in neighbourhood
		for (var i = 0; i < som.width; i++) {
			for (var j = 0; j < som.height; j++) {
				d2 = (minX-i)*(minX-i) + (minY-j)*(minY-j);
				if (d2 <= neighbourhood2) {
					strength = Math.exp(-d2/neighbourhood2) * som.learnRate;
					adjustNode(network[i][j], inputVector, strength);
				}
			}
		}
		//decrease radius and learning rate
		//neighbourhood2 -= som.width*som.height/numIter;
		neighbourhood2 -= 2 * som.gm * som.decayRate * neighbourhood2;
		som.learnRate -= som.decayRate;
	}	
	return network;
};

function initWeights(network) {
	for (var i = 0; i < som.width; i++) {
		network[i] = [];
		for (var j = 0; j < som.height; j++) {
			network[i][j] = Node(i, j);
		}
	}
}

function getSimilarity() {
	var network = [];
	for (var i = 0; i < som.width; i++) {
		network[i] = [];
		for (var j = 0; j < som.height; j++) {
			network[i][j] = 0;
			if (j > 0)
				network[i][j] += Math.sqrt(dist(som.weights[i][j], som.weights[i][j-1]));
			if (j < som.height - 1)
				network[i][j] += Math.sqrt(dist(som.weights[i][j], som.weights[i][j+1]));
			if (i > 0)
				network[i][j] += Math.sqrt(dist(som.weights[i][j], som.weights[i-1][j]));
			if (i < som.width - 1)
				network[i][j] += Math.sqrt(dist(som.weights[i][j], som.weights[i+1][j]));
		}
	}
	var maxDiff = 0;
	var minDiff = Infinity;
	for (var i = 0; i < som.width; i++) {
		for (var j = 0; j < som.height; j++) {
			if (network[i][j] > maxDiff)
				maxDiff = network[i][j];
			if (network[i][j] < minDiff)
				minDiff = network[i][j];
		}
	}
	for (var i = 0; i < som.width; i++) {
		for (var j = 0; j < som.height; j++) {
			network[i][j] = network[i][j] * (256/maxDiff);
		}
	}
	return network;
}

//helper functions - todo: add a function where i can just push the properties

//maybe stop when reaches a number
function dist(v1, v2) {
	var d2 = Math.pow(v1.hp - v2.hp, 2);
	d2 += Math.pow(v1.atk - v2.atk, 2);
	d2 += Math.pow(v1.def - v2.def, 2);
	d2 += Math.pow(v1.spAtk - v2.spAtk, 2);
	d2 += Math.pow(v1.spDef - v2.spDef, 2);
	d2 += Math.pow(v1.spd - v2.spd, 2);
	return d2;
}


function adjustNode(target, sample, t) {
	target.hp = target.hp*(1-t) + sample.hp*t;
	target.atk = target.atk*(1-t) + sample.atk*t;
	target.def = target.def*(1-t) + sample.def*t;
	target.spAtk = target.spAtk*(1-t) + sample.spAtk*t;
	target.spDef = target.spDef*(1-t) + sample.spDef*t;
	target.spd = target.spd*(1-t) + sample.spd*t;
}

//this one. do it in this one.
function renameStats(data) {
	for (var i = 0; i < data.length; i++) {
		data[i].hp = data[i]["HP"];	delete data[i]["HP"];
		data[i].atk = data[i]["Attack"];	delete data[i]["Attack"];
		data[i].def = data[i]["Defense"];	delete data[i]["Defense"];
		data[i].spAtk = data[i]["Sp. Attack"];	delete data[i]["Sp. Attack"];
		data[i].spDef = data[i]["Sp. Defense"];	delete data[i]["Sp. Defense"];
		data[i].spd = data[i]["Speed"];	delete data[i]["Speed"];
	}
}



//event listeners
function canvasMouseMove(event) {
	var mousePos = getMousePos(event);
	
	if (mousePos.x < 640 && mousePos.x > 20 && mousePos.y > 20 && mousePos.y < 620) {
		ctx.fillStyle = "silver";
		ctx.fillRect(640, 0, 200, 640);
		
		var x = Math.floor((mousePos.x - 20)/ som.gridWidth);
		var y = Math.floor((mousePos.y - 20)/ som.gridHeight);
		if (som.weights[x] === undefined) {
			return;
		}
		var weight = som.weights[x][y];
		
		ctx.fillStyle = "black";
		ctx.font = "20px Verdana";
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "start";
		
		var offset = 0;
		ctx.fillText("Score: " + som.similarity[x][y].toPrecision(5), 640 + 8, 30+offset);
		ctx.fillText("HP: " + weight.hp.toPrecision(3), 640 + 13, 50+offset);
		ctx.fillText("Attack: " + weight.atk.toPrecision(3), 640 + 13, 70+offset);
		ctx.fillText("Defense: " + weight.def.toPrecision(3), 640 + 13, 90+offset);
		ctx.fillText("Sp. Atk: " + weight.spAtk.toPrecision(3), 640 + 13, 110+offset);
		ctx.fillText("Sp. Def: " + weight.spDef.toPrecision(3), 640 + 13, 130+offset);
		ctx.fillText("Speed: " + weight.spd.toPrecision(3), 640 + 13, 150+offset);
		offset += 150;
		if (weight.pokemon !== undefined) {
			var list = weight.pokemon;
			for (var i = 0; i < list.length; i++) {
				var pokemon = pokemonData[list[i]];
				ctx.fillText(pokemon["Pokemon"], 640 + 8, 30+offset);
				ctx.fillText("HP: " + pokemon.hp, 640 + 13, 50+offset);
				ctx.fillText("Attack: " + pokemon.atk, 640+ 13, 70+offset);
				ctx.fillText("Defense: " + pokemon.def, 640 + 13, 90+offset);
				ctx.fillText("Sp. Atk: " + pokemon.spAtk, 640 + 13, 110+offset);
				ctx.fillText("Sp. Def: " + pokemon.spDef, 640 + 13, 130+offset);
				ctx.fillText("Speed: " + pokemon.spd, 640 + 13, 150+offset);
				offset += 150;
			}
		}
		
	}
}

function getMousePos(event) {
	var event = event || window.event;
	var xCoord = event.clientX - canvas.offsetLeft + document.body.scrollLeft;
	var yCoord = event.clientY - canvas.offsetTop + document.body.scrollTop;
	return {x: xCoord, y: yCoord};
}

function trainButtonClick(event) {
	//get parameters
	som.width = document.getElementById("networkWidth").value;
	som.height = document.getElementById("networkHeight").value;
	som.gm = Math.sqrt(som.width * som.height);
	som.gridWidth = 600/som.width;
	som.gridHeight = 600/som.height;
	
	var numIters = document.getElementById("numIters").value;
	som.decayRate = 1/numIters;
	som.learnRate = Number(document.getElementById("learnRate").value) / 100;
	
	
	//Random initialization
	var statRanges = [
		"hpMin", "hpMax", 
		"atkMin", "atkMax", 
		"defMin", "defMax", 
		"spAtkMin", "spAtkMax", 
		"spDefMin", "spDefMax", 
		"spdMin", "spdMax"];
	for (var i = 0; i < statRanges.length; i++) {
		Node[statRanges[i]] = Number(document.getElementById(statRanges[i]).value);
	}
	Node["hpRange"] = Node.hpMax - Node.hpMin;
	Node["atkRange"] = Node.atkMax - Node.atkMin;
	Node["defRange"] = Node.defMax - Node.defMin;
	Node["spAtkRange"] = Node.spAtkMax - Node.spAtkMin;
	Node["spDefRange"] = Node.spDefMax - Node.spDefMin;
	Node["spdRange"] = Node.spdMax - Node.spdMin;
	
	
	ctx.fillStyle = "#CC7711";
	ctx.fillRect(0, 0, 640, 640);
	ctx.fillStyle = "silver";
	ctx.fillRect(640, 0, 200, 640);
	
	som.weights = trainNetwork(pokemonData);
	
	var minX, minY;
	var minDist2, d2;
	var weight;
	
	//similarity
	som.similarity = getSimilarity();
	var x;
	for (var i = 0; i < som.width; i++) {
		for (var j = 0; j < som.height; j++) {
			x = (255 - Math.min(Math.floor(som.similarity[i][j]), 255)).toString(16);
			x = ("0" + x).slice(-2);
			ctx.fillStyle = "#" + x + x + x;
			ctx.fillRect(i * som.gridWidth + 20, j * som.gridHeight + 20, som.gridWidth, som.gridHeight);
		}
	}
	
	//draw sprites
	for (var id = 0; id < pokemonData.length; id++) {
		minDist2 = Infinity;
		for (var i = 0; i < som.width; i++) {
			for (var j = 0; j < som.height; j++) {
				weight = som.weights[i][j];
				d2 = dist(weight, pokemonData[id]);
				if (d2 < minDist2) {
					minDist2 = d2;
					minX = i;
					minY = j;
				}	
			}
		}
		
		sprites[id] = new Image();
		sprites[id].src = "sprites/" + pokemonData[id].ID.toString(10) + ".png"; 
		sprites[id].drawX = minX*som.gridWidth;
		sprites[id].drawY = minY*som.gridHeight;
		sprites[id].onload = function() {
			ctx.drawImage(
				this,
				x=this.drawX - 0.5 * Math.max(som.gridWidth, 32-som.gridWidth) + 20,
				y=this.drawY - 0.5 * Math.max(som.gridHeight, 32-som.gridHeight) + 20,
				width=Math.max(32, 2*som.gridWidth),
				height=Math.max(32, 2*som.gridHeight));
		};
		
		if (som.weights[minX][minY].pokemon === undefined) {
			som.weights[minX][minY].pokemon = [id];
		} else {
			som.weights[minX][minY].pokemon.push(id);
		}
	}
}

function calculateDefault(event) {
	var width = document.getElementById("networkWidth").value;
	var height = document.getElementById("networkHeight").value;
	document.getElementById("numIters").value = width * height + 100;
}


