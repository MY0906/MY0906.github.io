// ▼▼▼ 変更/追加: 設定値を定数として管理 ▼▼▼
const SETTINGS = {
  // メロディ雪だるま
  MELODY_SNOWMAN_HEAD_DIAMETER: 100,
  MELODY_SNOWMAN_BODY_DIAMETER: 150,
  MELODY_SNOWMAN_START_X_RATIO: 0.8,
  MELODY_SNOWMAN_HEAD_Y_RATIO: 0.57,
  MELODY_SNOWMAN_BODY_Y_RATIO: 0.725,
  MELODY_SNOWMAN_MOVE_SPEED: 5,
  MELODY_SNOWMAN_JUMP_FORCE: 18,
  MELODY_SNOWMAN_MIN_X_RATIO: 0.725,
  MELODY_SNOWMAN_MAX_X_RATIO: 0.95,
  
  // パンニング雪だるま
  PAN_SNOWMAN_HEAD_DIAMETER: 70,
  PAN_SNOWMAN_BODY_DIAMETER: 100,
  PAN_SNOWMAN_START_X_RATIO: 0.2,
  PAN_SNOWMAN_HEAD_Y_RATIO: 0.623,
  PAN_SNOWMAN_BODY_Y_RATIO: 0.735,
  PAN_SNOWMAN_MOVE_SPEED: 4,
  PAN_SNOWMAN_MIN_X_RATIO: 0.1,
  PAN_SNOWMAN_MAX_X_RATIO: 0.3,

  // その他
  AUTO_SNOW_INTERVAL: 10,
  WORLD_GRAVITY: 10,
  PARTICLE_COUNT: 20,
};

// グローバル変数
let snows = [];
let particles = [];
let waveType = 'sine';
let currentModeName, currentNotes, currentGradTop, currentGradBottom;
let currentColors = {};
let env; // p5.Envelope オブジェクト
let activeOscillators = []; // アクティブなオシレーターの配列

// 雪だるまの位置と状態
let melodySnowmanX = 0;
let melodySnowmanY = 0;
let melodySnowmanVelY = 0;
let melodySnowmanOnGround = false;
let panSnowmanX = 0;

// ▼▼▼ 変更/追加: 音階とモードをデータ構造で管理 ▼▼▼
const notes = {
  cMajorPent: [261.63, 293.66, 329.63, 392.00, 440.00], // C, D, E, G, A
  aMinorPent: [220.00, 246.94, 293.66, 329.63, 392.00], // A, B, D, E, G
  fMajorPent: [174.61, 196.00, 220.00, 261.63, 329.63], // F, G, A, C, E
  gMajorPent: [196.00, 220.00, 246.94, 293.66, 392.00], // G, A, B, D, G
  dMajorPent: [293.66, 329.63, 392.00, 440.00, 493.88], // D, E, G, A, B
};

// モードごとにグラデーション色と各パーツの線色・パーティクル色を設定
const modes = {
  '1': {
    name: 'A minor',
    notes: notes.aMinorPent,
    gradTop: '#1e1e3c', gradBottom: '#5078b4',
    domeOuterStroke: '#5078b4', domeInnerStroke: '#1e1e3c', floorStroke: '#5078b4',
    snow: '#e0e6f8',
    particle: '#aaddff'
  },
  '2': {
    name: 'C Major',
    notes: notes.cMajorPent,
    gradTop: '#87CEFA', gradBottom: '#ffffff',
    domeOuterStroke: '#87CEFA', domeInnerStroke: '#4682b4', floorStroke: '#87CEFA',
    snow: '#e0f7fa',
    particle: '#87CEFA'
  },
  '3': {
    name: 'F Major',
    notes: notes.fMajorPent,
    gradTop: '#ff6347', gradBottom: '#ffd7b4',
    domeOuterStroke: '#ff6347', domeInnerStroke: '#b22222', floorStroke: '#ff6347',
    snow: '#ffe4e1',
    particle: '#ff6347'
  },
  '4': {
    name: 'G Major',
    notes: notes.gMajorPent,
    gradTop: '#ffd700', gradBottom: '#ffffff',
    domeOuterStroke: '#ffd700', domeInnerStroke: '#b8860b', floorStroke: '#ffd700',
    snow: '#fffde4',
    particle: '#ffd700'
  },
  '5': {
    name: 'D Major',
    notes: notes.dMajorPent,
    gradTop: '#90ee90', gradBottom: '#ffffff',
    domeOuterStroke: '#90ee90', domeInnerStroke: '#228b22', floorStroke: '#90ee90',
    snow: '#e4ffe1',
    particle: '#90ee90'
  },
};

// ▼▼▼ 変更/追加: キー入力処理をシンプル化 ▼▼▼
function keyPressed() {
  if (modes[key]) {
    const selectedMode = modes[key];
    currentNotes = selectedMode.notes;
    currentModeName = selectedMode.name;
    currentGradTop = selectedMode.gradTop;
    currentGradBottom = selectedMode.gradBottom;
    currentColors = {
      domeOuterStroke: selectedMode.domeOuterStroke,
      domeInnerStroke: selectedMode.domeInnerStroke,
      floorStroke: selectedMode.floorStroke,
      snow: selectedMode.snow,
      particle: selectedMode.particle
    };
  }

  // 波形変更
  if (key === '6') waveType = 'square';
  if (key === '7') waveType = 'triangle';
  if (key === '8') waveType = 'sawtooth';
  if (key === '9') waveType = 'sine';

  // ジャンプ処理
  if (key === 'w' || key === 'W') {
    if (melodySnowmanOnGround) {
      melodySnowmanVelY = -SETTINGS.MELODY_SNOWMAN_JUMP_FORCE;
      melodySnowmanOnGround = false;
    }
  }
}

function setup() {
  colorMode(HSB, 360, 100, 100, 255);
  createCanvas(windowWidth, windowHeight);
  
  // 初期モードを設定
  const initialMode = modes['3'];
  currentNotes = initialMode.notes;
  currentModeName = initialMode.name;
  currentGradTop = initialMode.gradTop;
  currentGradBottom = initialMode.gradBottom;
  currentColors = {
    domeOuterStroke: initialMode.domeOuterStroke,
    domeInnerStroke: initialMode.domeInnerStroke,
    floorStroke: initialMode.floorStroke,
    snow: initialMode.snow,
    particle: initialMode.particle
  };

  // 雪だるまの初期位置
  melodySnowmanX = width * SETTINGS.MELODY_SNOWMAN_START_X_RATIO;
  melodySnowmanY = height * SETTINGS.MELODY_SNOWMAN_HEAD_Y_RATIO;
  panSnowmanX = width * SETTINGS.PAN_SNOWMAN_START_X_RATIO;

  // 音声エンベロープの初期化（エラーハンドリング付き）
  try {
    env = new p5.Envelope();
    env.setADSR(0.05, 0.2, 0.2, 0.3); // リリースを元に戻す
    env.setRange(0.5, 0);
  } catch (error) {
    console.log('音声初期化エラー:', error);
    env = null;
  }
}

function drawGradient(yStart, yEnd, c1, c2) {
  for (let y = yStart; y <= yEnd; y++) {
    let inter = map(y, yStart, yEnd, 0, 1);
    let c = lerpColor(color(c1), color(c2), inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function draw() {
  drawGradient(0, height, currentGradTop, currentGradBottom);

  // かまくらを描画（地面の後ろに配置）
  colorMode(RGB, 255, 255, 255, 255);
  stroke(currentColors.domeOuterStroke);
  strokeWeight(3);
  fill(255,255,255);
  ellipse(width * 0.5, height * 0.88, 500, 500);

  colorMode(RGB, 255, 255, 255, 255);
  stroke(0);
  strokeWeight(2);
  fill(180);
  ellipse(width * 0.5, height * 0.88, 250, 250);
  
  // 地面を描画（かまくらの上に重ねる）
  colorMode(RGB, 255, 255, 255, 255);
  stroke(currentColors.floorStroke);
  strokeWeight(2);
  fill(255,255,255);
  rect(0, height - 100, width, 100);

  // --- パンニング雪だるまの操作 ---
  const minPanX = width * SETTINGS.PAN_SNOWMAN_MIN_X_RATIO;
  const maxPanX = width * SETTINGS.PAN_SNOWMAN_MAX_X_RATIO;
  if (keyIsDown(LEFT_ARROW)) {
    panSnowmanX -= SETTINGS.PAN_SNOWMAN_MOVE_SPEED;
  } else if (keyIsDown(RIGHT_ARROW)) {
    panSnowmanX += SETTINGS.PAN_SNOWMAN_MOVE_SPEED;
  }
  panSnowmanX = constrain(panSnowmanX, minPanX, maxPanX);
  
  // パンニング雪だるまの体と頭のY座標を地面の上に自然に配置
  let panBodyY = height - 100 - SETTINGS.PAN_SNOWMAN_BODY_DIAMETER / 2;
  let panHeadY = panBodyY - (SETTINGS.PAN_SNOWMAN_BODY_DIAMETER / 2) - (SETTINGS.PAN_SNOWMAN_HEAD_DIAMETER / 2);

  // パンニング雪だるまを描画
  colorMode(RGB, 255, 255, 255, 255);
  stroke(0);
  strokeWeight(2);
  fill(255, 255, 255);
  ellipse(panSnowmanX, panBodyY, SETTINGS.PAN_SNOWMAN_BODY_DIAMETER, SETTINGS.PAN_SNOWMAN_BODY_DIAMETER);
  fill(255, 255, 255);
  ellipse(panSnowmanX, panHeadY, SETTINGS.PAN_SNOWMAN_HEAD_DIAMETER, SETTINGS.PAN_SNOWMAN_HEAD_DIAMETER);
  
  // ミニ雪だるまの顔を描画
  colorMode(RGB, 255, 255, 255, 255);
  stroke(0);
  fill(0);
  ellipse(panSnowmanX - 10, panHeadY - 7, 6, 6);
  ellipse(panSnowmanX + 10, panHeadY - 7, 6, 6);
  fill(255, 140, 0);
  triangle(panSnowmanX, panHeadY, panSnowmanX, panHeadY + 6, panSnowmanX + 12, panHeadY + 3);
  
  // --- メロディ雪だるまの操作 ---
  const minMelodyX = width * SETTINGS.MELODY_SNOWMAN_MIN_X_RATIO;
  const maxMelodyX = width * SETTINGS.MELODY_SNOWMAN_MAX_X_RATIO;
  if (keyIsDown(65)) { // 'A'キー
    melodySnowmanX -= SETTINGS.MELODY_SNOWMAN_MOVE_SPEED;
  } else if (keyIsDown(68)) { // 'D'キー
    melodySnowmanX += SETTINGS.MELODY_SNOWMAN_MOVE_SPEED;
  }
  melodySnowmanX = constrain(melodySnowmanX, minMelodyX, maxMelodyX);
  
  // メロディ雪だるまの体と頭のY座標を地面の上に自然に配置
  let melodyBodyY = height - 100 - SETTINGS.MELODY_SNOWMAN_BODY_DIAMETER / 2;
  let melodyHeadY = melodyBodyY - (SETTINGS.MELODY_SNOWMAN_BODY_DIAMETER / 2) - (SETTINGS.MELODY_SNOWMAN_HEAD_DIAMETER / 2);
  
  // 重力とジャンプの処理
  melodySnowmanVelY += 0.8; // 重力
  melodyBodyY += melodySnowmanVelY;
  if (melodyBodyY > height - 100 - SETTINGS.MELODY_SNOWMAN_BODY_DIAMETER / 2) {
    melodyBodyY = height - 100 - SETTINGS.MELODY_SNOWMAN_BODY_DIAMETER / 2;
    melodySnowmanVelY = 0;
    melodySnowmanOnGround = true;
  } else {
    melodySnowmanOnGround = false;
  }
  melodyHeadY = melodyBodyY - (SETTINGS.MELODY_SNOWMAN_BODY_DIAMETER / 2) - (SETTINGS.MELODY_SNOWMAN_HEAD_DIAMETER / 2);
  
  // メロディ雪だるまを描画
  colorMode(RGB, 255, 255, 255, 255);
  stroke(0);
  strokeWeight(2);
  fill(255, 255, 255);
  ellipse(melodySnowmanX, melodyBodyY, SETTINGS.MELODY_SNOWMAN_BODY_DIAMETER, SETTINGS.MELODY_SNOWMAN_BODY_DIAMETER);
  fill(255, 255, 255);
  ellipse(melodySnowmanX, melodyHeadY, SETTINGS.MELODY_SNOWMAN_HEAD_DIAMETER, SETTINGS.MELODY_SNOWMAN_HEAD_DIAMETER);
  
  // メロディ雪だるまの顔を描画
  colorMode(RGB, 255, 255, 255, 255);
  stroke(0);
  fill(0);
  ellipse(melodySnowmanX - 15, melodyHeadY - 10, 10, 10);
  ellipse(melodySnowmanX + 15, melodyHeadY - 10, 10, 10);
  fill(255, 140, 0);
  triangle(melodySnowmanX, melodyHeadY, melodySnowmanX, melodyHeadY + 10, melodySnowmanX + 20, melodyHeadY + 5);
  
  // --- 雪を降らせる ---
  if (frameCount % SETTINGS.AUTO_SNOW_INTERVAL === 0 && !mouseIsPressed) {
    snows.push({
      x: random(width),
      y: -50,
      size: random(5, 15),
      speed: random(1, 3),
      vx: random(-1, 1), // 横方向の初期速度
      vy: random(1, 3)   // 縦方向の初期速度
    });
  }

  // --- 雪を描画・更新 ---
  let landedSnows = []; // 地面に落ちた雪玉を一時的に集める
  for (let i = snows.length - 1; i >= 0; i--) {
    let snow = snows[i];
    
    // 雪を描画
    noStroke();
    fill(currentColors.snow);
    ellipse(snow.x, snow.y, snow.size, snow.size);
    
    // 雪を落下させる
    snow.vy += 0.03; // 重力（ゆっくり落ちるように調整済み）
    snow.x += snow.vx;
    snow.y += snow.vy;

    // かまくらとの衝突判定
    let snowdomeCenterX = width * 0.5;
    let snowdomeCenterY = height * 0.88;
    let distance = dist(snow.x, snow.y, snowdomeCenterX, snowdomeCenterY);
    let snowdomeRadius = 250;
    if (distance < snowdomeRadius + snow.size / 2) {
      snow.vx = 0;
      let nx = (snow.x - snowdomeCenterX) / distance;
      let ny = (snow.y - snowdomeCenterY) / distance;
      let overlap = snowdomeRadius + snow.size / 2 - distance;
      snow.x += nx * overlap;
      snow.y += ny * overlap;
    }

    // 雪だるま（メロディ・ミニ両方）の体・頭との衝突判定
    let snowmen = [
      { x: melodySnowmanX, y: melodyBodyY, r: SETTINGS.MELODY_SNOWMAN_BODY_DIAMETER / 2 },
      { x: melodySnowmanX, y: melodyHeadY, r: SETTINGS.MELODY_SNOWMAN_HEAD_DIAMETER / 2 },
      { x: panSnowmanX, y: panBodyY, r: SETTINGS.PAN_SNOWMAN_BODY_DIAMETER / 2 },
      { x: panSnowmanX, y: panHeadY, r: SETTINGS.PAN_SNOWMAN_HEAD_DIAMETER / 2 }
    ];
    for (let snowman of snowmen) {
      let d = dist(snow.x, snow.y, snowman.x, snowman.y);
      if (d < snowman.r + snow.size / 2) {
        let nx = (snow.x - snowman.x) / d;
        let ny = (snow.y - snowman.y) / d;
        let overlap = snowman.r + snow.size / 2 - d;
        snow.x += nx * overlap;
        snow.y += ny * overlap;
        snow.vx = 0;
      }
    }

    // 地面に当たったら音を鳴らして削除＋エフェクト
    if (snow.y > height - 100) {
      landedSnows.push(snow); // ここで一時配列に追加
      createLandingEffect(snow.x, height - 100);
      snows.splice(i, 1);
    }
  }

  // 地面に落ちた雪玉があれば和音で鳴らす
  if (landedSnows.length > 0) {
    playChordForSnows(landedSnows);
  }

  // --- パーティクルの更新と描画 ---
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isFinished()) {
      particles.splice(i, 1);
    }
  }

  // UIを描画
  drawUI();
}

function drawUI() {
  fill(255);
  stroke(0);
  strokeWeight(3);
  textSize(16);
  textAlign(LEFT, TOP);

  textAlign(RIGHT, TOP);
  let statusText = `
  Mode: ${currentModeName}
  Waveform: ${waveType}`;
  text(statusText, width - 10, 10);
}

// playSnowSoundは単音用に変更
function playSnowSound(note, panValue, amp, waveTypeOverride, delay = 0) {
  if (!env) return;
  // 同時発音数を増やして、より多くの音を同時に鳴らせるように
  if (activeOscillators.length >= 8) {
    let oldOsc = activeOscillators.shift();
    oldOsc.stop();
  }
  setTimeout(() => {
    try {
      let osc = new p5.Oscillator(waveTypeOverride || waveType);
      osc.pan(panValue);
      osc.freq(note);
      osc.amp(env);
      osc.start();
      env.play(osc, 0, 0.1);
      osc.stop(1.2); // 停止時間を元に戻す
      activeOscillators.push(osc);
    } catch (error) {
      console.log('音声再生エラー:', error);
    }
  }, delay);
}

// 和音で鳴らす
function playChordForSnows(snows) {
  // メロディ雪だるまの位置でcurrentNotesのルートインデックスを決める
  const melodyMinX = width * SETTINGS.MELODY_SNOWMAN_MIN_X_RATIO;
  const melodyMaxX = width * SETTINGS.MELODY_SNOWMAN_MAX_X_RATIO;
  let melodyRatio = map(melodySnowmanX, melodyMinX, melodyMaxX, 0, 1);
  melodyRatio = constrain(melodyRatio, 0, 1);
  let rootIdx = Math.floor(melodyRatio * (currentNotes.length - 1));

  // 和音の割り当てはルートから順に(currentNotes.lengthでループ)
  const panMinX = width * SETTINGS.PAN_SNOWMAN_MIN_X_RATIO;
  const panMaxX = width * SETTINGS.PAN_SNOWMAN_MAX_X_RATIO;
  for (let i = 0; i < snows.length; i++) {
    let noteIdx = (rootIdx + i) % currentNotes.length;
    let note = currentNotes[noteIdx];
    // パンはパン雪だるまの位置から
    let panValue = map(panSnowmanX, panMinX, panMaxX, -1.0, 1.0);
    panValue = constrain(panValue, -1.0, 1.0);
    // 音量は雪玉の落下速度で変化（平均値）
    let vy = snows[i].vy;
    let amp = map(vy, 0, 5, 0.2, 0.7, true);
    // 各音に10msずつ遅延を追加（音が重なりすぎることを防ぐ）
    playSnowSound(note, panValue, amp, null, i * 10);
  }
}

function createLandingEffect(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push(new Particle(x, y));
  }
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.acc = createVector(0, 0);
    this.lifespan = 255;
    this.size = random(3, 8);
    this.hue = random(0, 360);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 5;
  }

  show() {
    noStroke();
    colorMode(HSB, 360, 100, 100, 255);
    fill(this.hue, 80, 100, this.lifespan);
    ellipse(this.pos.x, this.pos.y, this.size);
    colorMode(RGB, 255, 255, 255, 255);
  }

  isFinished() {
    return this.lifespan < 0;
  }
} 
