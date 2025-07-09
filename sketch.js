let osc1, osc2, osc3;

function setup() {
  createCanvas(400, 200);
  osc1 = new p5.Oscillator('sine');
  osc2 = new p5.Oscillator('sine');
  osc3 = new p5.Oscillator('sine');
  textAlign(CENTER, CENTER);
  textSize(24);
}

function draw() {
  background(220);
  text('クリックでCメジャーコード', width/2, height/2);
}

function mousePressed() {
  osc1.freq(261.63); // C
  osc2.freq(329.63); // E
  osc3.freq(392.00); // G
  osc1.amp(0.3, 0.05);
  osc2.amp(0.3, 0.05);
  osc3.amp(0.3, 0.05);
  osc1.start();
  osc2.start();
  osc3.start();
}

function mouseReleased() {
  osc1.amp(0, 0.5);
  osc2.amp(0, 0.5);
  osc3.amp(0, 0.5);
} 
