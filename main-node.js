fs = require("fs");
parse = require("csv-parse");

fs.readFile("pokemonData.csv", function(err, data) {
	if (err)
		return console.log(err);
	parse(data.toString(), {columns: true}, function(err, output) {
		trainNetwork(output);
	});
});

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

//Size right now is 15x15
function trainNetwork(data) {
	var decayRate = 0.035;
	var neighbourhood = 50;
	var learnRate = 0.1;
	
	
	var network = [];
	initWeights(network);	//randomize weights in map
	
	var inputVector, weight;
	var d2, minDist2;
	var minX, minY;
	while (neighbourhood > 1) {
		inputVector = data[Math.floor(Math.random() * 151)];
		//find best fit (euclidian) (maybe try cosine distance)
		minDist2 = Infinity;
		for (var i = 0; i < 15; i++) {
			for (var j = 0; j < 15; j++) {
				weight = network[i][j];
				d2 = dist(weight, inputVector);
				if (d2 < minDist2) {
					minDist2 = d2;
					minX = i;
					minY = j;
				}
			}
		}
	}
		
	neighbourhood *= Math.exp(-2*decayRate);
	learnRate *= Math.exp(-decayRate);
};

function initWeights(network) {
	for (var i = 0; i < 15; i++) {
		network[i] = [];
		for (var j = 0; j < 15; j++) {
			network[i][j] = Node(i, j);
		}
	}
}


//helper functions

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

