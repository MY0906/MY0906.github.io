let floor;
let SnowMan1, SnowMan2, MinSnowMan1, MinSnowMan2;
let SnoeDome1, SnoeDome2;
let snows;

let waveType = 'sine';
let snowmanSpeed = 5;
let autoSnowInterval = 10;

// 音階
let notes1 = [261.63, 293.66, 329.23, 349.23, 392.00, 440.00, 493.88];//Cメジャー
let notes2 = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00];//Aマイナー
let notes3 = [174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63]; //Fメジャー
let notes4 = [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 392.00]; // Gメジャー
let notes5 = [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // Dメジャー


let currentNotes = notes3;

// キーを押すことによって背景の色を変える
function keyPressed(){
	if (key === '1'){
		background(0);
		currentNotes = notes2;//Aマイナー
	}else if (key === '2'){
		background(135, 206, 250);
		currentNotes = notes1;//Cメジャー
	}else if (key === '3'){
		background(255, 99, 71);
		currentNotes = notes3;//Fメジャー
  } else if (key === '4') {
    background(255, 215, 0);
    currentNotes = notes4; // Gメジャー
  } else if (key === '5') {
    background(144, 238, 144);
    currentNotes = notes5; // Dメジャー
  }
	if(key === '6')waveType = 'square';
	if(key === '7')waveType = 'triangle';
	if(key === '8')waveType = 'satooth';
}
//基本設定
function setup(){
	createCanvas(windowWidth, windowHeight);
	world.gravity.y = 5;
	
	// かまくらを作る
	SnowDome1 = new Sprite(width * 0.5, height * 0.8, 500, 'static');
	SnowDome1.color = 'snow';
	
	SnowDome2 = new Sprite(width * 0.5, height * 0.8, 250, 'static');
	SnowDome2.color = 'gray'
	
	//地面を作る
	floor = new Sprite(width * 0.5, height, width, 300, 'static');
	floor.color = 'snow'
	
	// 雪だるまを作る
　SnowMan1 = new Sprite(width * 0.8, height * 0.57, 100, 'dynamic');
	SnowMan1.color = 'snow';
	SnowMan1.vel.x = 0;
	
	SnowMan2 = new Sprite(width * 0.8, height * 0.725, 150, 'dynamic');
	SnowMan2.color = 'snow';
	SnowMan2.vel.x = 0;
	
	MinSnowMan1 = new Sprite(width * 0.2, height * 0.623, 70, 'static');
	MinSnowMan1.color = 'snow';
	
	MinSnowMan2 = new Sprite(width * 0.2, height * 0.735, 100, 'static');
	MinSnowMan2.color = 'snow';
	
	
	//雪を降らせておく
	snows = new Group();
	for(let i = 0; i < 5; i++){
		let snow = new Sprite(random(width), random(50, 150));
		snow.color = 'white';
		snow.diameter = 10;
		snows.add(snow);
	}
}

function draw(){	
	//描写をリセット
	clear();
	
	// 雪だるまの行動範囲
	const minX = width * 0.725; 
  const maxX = width * 0.95;
  SnowMan1.x = constrain(SnowMan1.x, minX, maxX);
  SnowMan2.x = constrain(SnowMan2.x, minX, maxX);
	
	
	// 雪だるまを動かす
	if(keyIsDown(65)){
		SnowMan1.vel.x = -snowmanSpeed;
		SnowMan2.vel.x = -snowmanSpeed;
	}else if(keyIsDown(68)){
		SnowMan1.vel.x = snowmanSpeed;
		SnowMan2.vel.x = snowmanSpeed;
	}else{
		SnowMan1.vel.x = 0;
		SnowMan2.vel.x = 0;
	}
	
	// 円を定期的に降らせる、マウスを押すと円を止める
	 if (frameCount % autoSnowInterval === 0 && !mouseIsPressed) {
    let snow = new Sprite(random(width), random(50));
    snow.color = 'white';
    snow.diameter = random(5, 15);
    snow.vel.y = random(1, 3);
    snows.add(snow);
  }

	
	//マウスを押すと円を降らせる
	// if (mouse.presses()) {
	// 	for(let i = 0; i < 5; i++){
	// 		let snow = new Sprite(random(width), random(50, 300));
	// 		snow.color = 'white';
	// 		snow.diameter = random(5,15);
	// 		snow.vel.y = random(0,3);
	// 		snows.add(snow);
	// 	}
	// }
	
	
	//地面と衝突した時に円が消える
	floor.overlaps(snows, collect);
}

function collect(floor, snow){
  // 雪だるまの位置によって音階を変える
	let snowmanX = (SnowMan1.x + SnowMan2.x) / 2
	let baseNote = map(snowmanX, 0, width, currentNotes[0], currentNotes[currentNotes.length - 1]);
	// 
  let offsetX = SnowMan1.x - width * 0.725;
	let octaveChange = Math.floor(offsetX / 100);
	let adjustedNote = baseNote * Math.pow(2, octaveChange);
	
	let osc = new p5.Oscillator(waveType);
	osc.freq(adjustedNote);
	osc.amp(0.5);
	osc.amp(0, 0.5)
	osc.start();

	snow.remove();
}