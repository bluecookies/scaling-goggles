var WIDTH = 20;
var HEIGHT = 20;
var GRIDWIDTH = 600/WIDTH;
var GRIDHEIGHT = 600/HEIGHT;

var network = [];

var canvas, ctx;

window.onload = function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	ctx.fillStyle = "#CC7711";
	ctx.fillRect(0, 0, 600, 600);
	ctx.fillStyle = "silver";
	ctx.fillRect(600, 0, 200, 600);
	
	pokemonData = JSON.parse(pokemonData);
	renameStats(pokemonData);

	ctx.strokeStyle = "black";
	ctx.lineWidth = 2;
	for (var i = 0; i < WIDTH; i++) {
		for (var j = 0; j < HEIGHT; j++) {
			ctx.strokeRect(i * GRIDWIDTH, j * GRIDHEIGHT, GRIDWIDTH, GRIDHEIGHT);
		}
	}
	
	
	network = trainNetwork(pokemonData);
	
	var minX, minY;
	var minDist2, d2;
	var weight;
	
	ctx.fillStyle = "green";
	for (var id = 0; id < pokemonData.length; id++) {
		minDist2 = Infinity;
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
				weight = network[i][j];
				d2 = dist(weight, pokemonData[id]);
				if (d2 < minDist2) {
					minDist2 = d2;
					minX = i;
					minY = j;
				}	
			}
		}
		ctx.fillRect(minX*GRIDWIDTH, minY*GRIDHEIGHT, GRIDWIDTH, GRIDHEIGHT);
		if (network[minX][minY].pokemon === undefined) {
			network[minX][minY].pokemon = [id];
		} else {
			network[minX][minY].pokemon.push(id);
		}
	}
	
	canvas.addEventListener("mousemove", canvasMouseMove);
};

//HP: 10 - 160 (Chansey 250)
//I'll just do uniform 20-150 for now
//HP, Attack, Defense, SpAttack, SpDef, Speed
function Node(x, y) {
	return {
		x: x,
		y: y,
		hp: (Math.random() * 150 + 10), 
		atk: (Math.random() * 150 + 10), 
		def: (Math.random() * 150 + 10),
		spAtk: (Math.random() * 150 + 10),
		spDef: (Math.random() * 150 + 10),
		spd: (Math.random() * 150 + 10)};
};	//non normalized

function trainNetwork(data) {
	var neighbourhood2 = WIDTH * HEIGHT; //Math.max(WIDTH, HEIGHT);
	var learnRate = 1;
	var numIter = 800;
	
	
	var network = [];
	initWeights(network);	//randomize weights in map
	
	var inputVector, weight;
	var d2, minDist2;
	var minX, minY;
	var BMU;
	var strength;
	while (neighbourhood2 > 1) {
		inputVector = data[Math.floor(Math.random() * 151)];
		//find best fit (euclidian) (maybe try cosine distance)
		minDist2 = Infinity;
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
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
		for (var i = 0; i < WIDTH; i++) {
			for (var j = 0; j < HEIGHT; j++) {
				d2 = (minX-i)*(minX-i) + (minY-j)*(minY-j);
				if (d2 <= neighbourhood2) {
					strength = Math.exp(-d2/neighbourhood2) * learnRate;
					adjustNode(network[i][j], inputVector, strength);
				}
			}
		}
		//decrease radius and learning rate
		neighbourhood2 -= WIDTH*HEIGHT/numIter;
		learnRate -= 1/numIter;
	}	
	return network;
};

function initWeights(network) {
	for (var i = 0; i < WIDTH; i++) {
		network[i] = [];
		for (var j = 0; j < HEIGHT; j++) {
			network[i][j] = Node(i, j);
		}
	}
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
	
	if (mousePos.x < 600) {
		ctx.fillStyle = "silver";
		ctx.fillRect(600, 0, 200, 600);
		
		var x = Math.floor(mousePos.x / GRIDWIDTH);
		var y = Math.floor(mousePos.y / GRIDHEIGHT);
		if (network[x] === undefined) {
			return;
		}
		var weight = network[x][y];
		
		ctx.fillStyle = "black";
		ctx.font = "20px Verdana";
		ctx.textBaseline = "alphabetic";
		ctx.textAlign = "start";
		
		var offset = 0;
		ctx.fillText("Weight info", 600 + 8, 30+offset);
		ctx.fillText("HP:" + weight.hp.toPrecision(3), 600 + 13, 50+offset);
		ctx.fillText("Attack:" + weight.atk.toPrecision(3), 600 + 13, 70+offset);
		ctx.fillText("Defense:" + weight.def.toPrecision(3), 600 + 13, 90+offset);
		ctx.fillText("Sp. Atk:" + weight.spAtk.toPrecision(3), 600 + 13, 110+offset);
		ctx.fillText("Sp. Def:" + weight.spDef.toPrecision(3), 600 + 13, 130+offset);
		ctx.fillText("Speed:" + weight.spd.toPrecision(3), 600 + 13, 150+offset);
		offset += 150;
		if (weight.pokemon !== undefined) {
			var list = weight.pokemon;
			for (var i = 0; i < list.length; i++) {
				var pokemon = pokemonData[list[i]];
				ctx.fillText(pokemon["Pokemon"], 600 + 8, 30+offset);
				ctx.fillText("HP:" + pokemon.hp, 600 + 13, 50+offset);
				ctx.fillText("Attack:" + pokemon.atk, 600+ 13, 70+offset);
				ctx.fillText("Defense:" + pokemon.def, 600 + 13, 90+offset);
				ctx.fillText("Sp. Atk:" + pokemon.spAtk, 600 + 13, 110+offset);
				ctx.fillText("Sp. Def:" + pokemon.spDef, 600 + 13, 130+offset);
				ctx.fillText("Speed:" + pokemon.spd, 600 + 13, 150+offset);
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



