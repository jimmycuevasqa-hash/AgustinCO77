"use strict";

const configuration = {
  body: "coupe",
  label: "COUPÉ",
  speed: 74,
  color: "#ff3d3d",
  colorName: "ROJO FUEGO",
  stripe: "stripe-none",
  skin: "skin-clean",
  wheels: "wheels-street",
  spoiler: "spoiler-stock",
  backdrop: "scene-day",
  boosterCount: 0
};

const garageScreen = document.querySelector("#garage-screen");
const raceScreen = document.querySelector("#race-screen");
const garageCar = document.querySelector("#garage-car");
const raceCar = document.querySelector("#race-player-car");
const bodyButtons = document.querySelectorAll(".body-options .option-card");
const paintButtons = document.querySelectorAll(".paint");
const detailButtons = document.querySelectorAll(".detail");
const skinButtons = document.querySelectorAll(".skin");
const wheelButtons = document.querySelectorAll(".wheel-options .upgrade");
const spoilerButtons = document.querySelectorAll(".spoiler-options .upgrade");
const backdropButtons = document.querySelectorAll(".backdrop");
const garageShowcase = document.querySelector("#garage-showcase");
const raceScene = document.querySelector("#race-scene");
const styleLabel = document.querySelector("#style-label");
const speedLabel = document.querySelector("#speed-label");
const boostLabel = document.querySelector("#boost-label");
const paintName = document.querySelector("#paint-name");
const raceButton = document.querySelector("#race-button");
const accelerateButton = document.querySelector("#accelerate-button");
const moveLeftButton = document.querySelector("#move-left-button");
const moveRightButton = document.querySelector("#move-right-button");
const countdown = document.querySelector("#countdown");
const instruction = document.querySelector("#race-instruction");
const playerProgressBar = document.querySelector("#player-progress");
const botProgressBar = document.querySelector("#bot-progress");
const playerWrap = document.querySelector(".player-wrap");
const botWraps = Array.from(document.querySelectorAll(".bot-wrap"));
const defaultBotNames = ["NEON-X", "BLAZE", "GHOST"];
let activeRivalNames = [...defaultBotNames];
let activeGroupName = "";
const road = document.querySelector(".road");
const hudPlayerName = document.querySelector("#hud-player-name");
const resultModal = document.querySelector("#result-modal");
const resultKicker = document.querySelector("#result-kicker");
const resultTitle = document.querySelector("#result-title");
const resultText = document.querySelector("#result-text");
const againButton = document.querySelector("#again-button");
const drawingCanvas = document.querySelector("#drawing-canvas");
const brushColor = document.querySelector("#brush-color");
const brushSize = document.querySelector("#brush-size");
const eraserButton = document.querySelector("#eraser-button");
const clearDrawingButton = document.querySelector("#clear-drawing-button");
const speedReadout = document.querySelector("#speed-readout");
const boostMeterFill = document.querySelector("#boost-meter-fill");
const telemetryGear = document.querySelector("#telemetry-gear");
const telemetryRpm = document.querySelector("#telemetry-rpm");
const nitroButton = document.querySelector("#nitro-button");
const boostPads = document.querySelectorAll(".boost-pad");
const nitroPickups = document.querySelectorAll(".nitro-pickup");
const trackObstacles = document.querySelectorAll(".track-obstacle");
const trackRamps = document.querySelectorAll(".track-ramp");
const lookLeftButton = document.querySelector("#look-left-button");
const lookRightButton = document.querySelector("#look-right-button");
const boosterCountLabel = document.querySelector("#booster-count");
const creditCount = document.querySelector("#credit-count");
const rewardPanel = document.querySelector("#reward-panel");
const rewardTitle = document.querySelector("#reward-title");
const rewardDescription = document.querySelector("#reward-description");
const groupNameInput = document.querySelector("#group-name-input");
const memberNameInput = document.querySelector("#member-name-input");
const addMemberButton = document.querySelector("#add-member-button");
const saveGroupButton = document.querySelector("#save-group-button");
const groupRaceButton = document.querySelector("#group-race-button");
const groupMembersList = document.querySelector("#group-members-list");
const groupStatus = document.querySelector("#group-status");
const hudRivalsName = document.querySelector("#hud-rivals-name");
const rivalsTag = document.querySelector("#rivals-tag");

const drawingContext = drawingCanvas.getContext("2d");
let isDrawing = false;
let isErasing = false;
let lastPoint = null;

function canvasPoint(event) {
  const bounds = drawingCanvas.getBoundingClientRect();

  return {
    x: (event.clientX - bounds.left) * (drawingCanvas.width / bounds.width),
    y: (event.clientY - bounds.top) * (drawingCanvas.height / bounds.height)
  };
}

function updateArtwork() {
  const art = drawingCanvas.toDataURL("image/png");
  const backgroundArt = `url("${art}")`;

  garageCar.style.setProperty("--custom-art", backgroundArt);
  raceCar.style.setProperty("--custom-art", backgroundArt);
}

function drawLine(from, to) {
  drawingContext.save();
  drawingContext.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
  drawingContext.strokeStyle = brushColor.value;
  drawingContext.lineWidth = Number(brushSize.value);
  drawingContext.lineCap = "round";
  drawingContext.lineJoin = "round";
  drawingContext.beginPath();
  drawingContext.moveTo(from.x, from.y);
  drawingContext.lineTo(to.x, to.y);
  drawingContext.stroke();
  drawingContext.restore();
}

drawingCanvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  isDrawing = true;
  lastPoint = canvasPoint(event);
  drawingCanvas.setPointerCapture(event.pointerId);
  drawLine(lastPoint, { x: lastPoint.x + 0.1, y: lastPoint.y + 0.1 });
  updateArtwork();
});

drawingCanvas.addEventListener("pointermove", (event) => {
  if (!isDrawing) return;

  const point = canvasPoint(event);
  drawLine(lastPoint, point);
  lastPoint = point;
  updateArtwork();
});

function finishDrawing(event) {
  if (!isDrawing) return;

  isDrawing = false;
  lastPoint = null;
  if (drawingCanvas.hasPointerCapture(event.pointerId)) {
    drawingCanvas.releasePointerCapture(event.pointerId);
  }
  updateArtwork();
}

drawingCanvas.addEventListener("pointerup", finishDrawing);
drawingCanvas.addEventListener("pointercancel", finishDrawing);

eraserButton.addEventListener("click", () => {
  isErasing = !isErasing;
  eraserButton.classList.toggle("active", isErasing);
  eraserButton.textContent = isErasing ? "PINCEL" : "BORRADOR";
  drawingCanvas.style.cursor = isErasing ? "cell" : "crosshair";
});

clearDrawingButton.addEventListener("click", () => {
  drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  updateArtwork();
});

let raceState = null;
let animationFrame = null;
let countdownTimer = null;
let credits = Number.parseInt(localStorage.getItem("garage-sprint-credits") || "0", 10);
let group = { name: "", members: [] };

function updateCredits() {
  creditCount.textContent = String(credits).padStart(3, "0");
}

function awardVictoryReward() {
  const baseReward = 100 + Math.floor(Math.random() * 4) * 50;
  const boosterBonus = configuration.boosterCount * 15;
  const totalReward = baseReward + boosterBonus;
  const prizeNames = ["CAJA DE PINTURA", "KIT DE LLANTAS", "PLACA DE CAMPEÓN", "MEJORA DE TURBO"];
  const prize = prizeNames[Math.floor(Math.random() * prizeNames.length)];

  credits += totalReward;
  localStorage.setItem("garage-sprint-credits", String(credits));
  updateCredits();

  againButton.innerHTML = "COBRAR Y VOLVER <span>↺</span>";
  rewardTitle.textContent = `+${totalReward} CRÉDITOS · ${prize}`;
  rewardDescription.textContent = configuration.boosterCount
    ? `Bono de +${boosterBonus} créditos por correr con ${configuration.boosterCount} impulsores.`
    : "Añade impulsores para obtener un bono adicional.";
  rewardPanel.classList.remove("hidden");
}

function resetRewardPanel() {
  rewardPanel.classList.add("hidden");
}

function saveGroup() {
  localStorage.setItem("garage-sprint-group", JSON.stringify(group));
}

function renderGroup() {
  groupNameInput.value = group.name;
  groupMembersList.innerHTML = "";

  group.members.forEach((member, index) => {
    const item = document.createElement("li");
    item.className = "group-member";
    item.innerHTML = `<span>${member}</span><button class="remove-member" type="button" aria-label="Quitar a ${member}" data-index="${index}">×</button>`;
    groupMembersList.append(item);
  });

  groupMembersList.querySelectorAll(".remove-member").forEach((button) => {
    button.addEventListener("click", () => {
      group.members.splice(Number(button.dataset.index), 1);
      saveGroup();
      renderGroup();
    });
  });

  const memberCount = group.members.length;
  groupRaceButton.disabled = memberCount === 0;
  groupStatus.textContent = memberCount
    ? `${group.name || "TU GRUPO"} listo: ${memberCount} piloto${memberCount === 1 ? "" : "s"} para competir contra ti.`
    : "Agrega entre 1 y 3 pilotos para una carrera de grupo.";
}

function loadGroup() {
  try {
    const savedGroup = JSON.parse(localStorage.getItem("garage-sprint-group") || "null");
    if (savedGroup && Array.isArray(savedGroup.members)) {
      group = {
        name: String(savedGroup.name || "").slice(0, 22),
        members: savedGroup.members.map((member) => String(member).trim()).filter(Boolean).slice(0, 3)
      };
    }
  } catch {
    group = { name: "", members: [] };
  }

  renderGroup();
}

function syncGroupName() {
  group.name = groupNameInput.value.trim().replace(/\s+/g, " ").slice(0, 22);
}

function addGroupMember() {
  syncGroupName();
  const member = memberNameInput.value.trim().replace(/\s+/g, " ").slice(0, 16);

  if (!member) {
    groupStatus.textContent = "Escribe el nombre de un piloto antes de agregarlo.";
    return;
  }

  if (group.members.length >= 3) {
    groupStatus.textContent = "El grupo puede tener un máximo de 3 pilotos.";
    return;
  }

  if (group.members.some((name) => name.toLocaleLowerCase() === member.toLocaleLowerCase())) {
    groupStatus.textContent = "Ese piloto ya está en el grupo.";
    return;
  }

  group.members.push(member);
  memberNameInput.value = "";
  saveGroup();
  renderGroup();
}

function setCarAppearance(car) {
  car.classList.remove(
    "body-coupe",
    "body-sport",
    "body-muscle",
    "stripe-none",
    "stripe-racing",
    "stripe-bolt",
    "skin-clean",
    "skin-flames",
    "skin-carbon",
    "skin-neon",
    "skin-camo",
    "wheels-street",
    "wheels-racing",
    "wheels-neon",
    "spoiler-stock",
    "spoiler-wing",
    "spoiler-rocket"
  );
  car.classList.add(
    `body-${configuration.body}`,
    configuration.stripe,
    configuration.skin,
    configuration.wheels,
    configuration.spoiler
  );
  car.classList.toggle("has-boosters", configuration.boosterCount > 0);
  car.style.setProperty("--booster-count", configuration.boosterCount);
  car.style.setProperty("--car-color", configuration.color);
}

function updateGarage() {
  setCarAppearance(garageCar);
  styleLabel.textContent = configuration.label;
  speedLabel.textContent = configuration.speed;
  boostLabel.textContent = configuration.boosterCount
    ? configuration.boosterCount
    : configuration.body === "sport" ? "3" : "2";
  boosterCountLabel.value = configuration.boosterCount;
  paintName.textContent = configuration.colorName;
}

function updateBoosterRigs() {
  const visibleBoosters = Math.min(configuration.boosterCount, 24);

  [garageCar, raceCar].forEach((car) => {
    const rig = car.querySelector(".booster-rig");
    rig.innerHTML = "";
    rig.style.setProperty("--visible-boosters", visibleBoosters);

    for (let index = 0; index < visibleBoosters; index += 1) {
      rig.append(document.createElement("i"));
    }

    rig.setAttribute(
      "aria-label",
      `${configuration.boosterCount} impulsores instalados${configuration.boosterCount > visibleBoosters ? `; se muestran ${visibleBoosters}` : ""}`
    );
  });
}

function setBoosterCount(value) {
  const count = Number.parseInt(value, 10);
  configuration.boosterCount = Number.isFinite(count) ? Math.max(0, count) : 0;
  updateBoosterRigs();
  updateGarage();
}

boosterCountLabel.addEventListener("input", () => setBoosterCount(boosterCountLabel.value));
boosterCountLabel.addEventListener("blur", () => setBoosterCount(boosterCountLabel.value));

bodyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    bodyButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");

    configuration.body = button.dataset.body;
    configuration.label = button.dataset.label;
    configuration.speed = Number(button.dataset.speed);
    updateGarage();
  });
});

paintButtons.forEach((button) => {
  button.addEventListener("click", () => {
    paintButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");

    configuration.color = button.dataset.color;
    configuration.colorName = button.dataset.name;
    document.documentElement.style.setProperty("--accent", configuration.color);
    updateGarage();
  });
});

detailButtons.forEach((button) => {
  button.addEventListener("click", () => {
    detailButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");

    configuration.stripe = button.dataset.stripe;
    updateGarage();
  });
});

skinButtons.forEach((button) => {
  button.addEventListener("click", () => {
    skinButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");

    configuration.skin = button.dataset.skin;
    updateGarage();
  });
});

wheelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    wheelButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");

    configuration.wheels = button.dataset.wheels;
    updateGarage();
  });
});

spoilerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    spoilerButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");

    configuration.spoiler = button.dataset.spoiler;
    updateGarage();
  });
});

backdropButtons.forEach((button) => {
  button.addEventListener("click", () => {
    backdropButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");

    configuration.backdrop = button.dataset.backdrop;
    ["scene-day", "scene-sunset", "scene-night"].forEach((scene) => {
      garageShowcase.classList.remove(scene);
      raceScene.classList.remove(scene);
    });
    garageShowcase.classList.add(configuration.backdrop);
    raceScene.classList.add(configuration.backdrop);
  });
});

function resetRaceView() {
  cancelAnimationFrame(animationFrame);
  clearTimeout(countdownTimer);
  raceState = null;
  road.classList.remove("racing");
  playerWrap.style.left = "10%";
  playerWrap.style.bottom = "42%";
  botWraps.forEach((botWrap, index) => {
    botWrap.style.left = `${8 + index * 2}%`;
    botWrap.classList.toggle("hidden", index >= activeRivalNames.length);
  });
  trackObstacles.forEach((obstacle) => {
    obstacle.classList.remove("hit", "cleared");
  });
  trackRamps.forEach((ramp) => ramp.classList.remove("used"));
  raceScene.classList.remove("camera-left", "camera-right");
  lookLeftButton.classList.remove("active");
  lookRightButton.classList.remove("active");
  playerProgressBar.style.width = "0%";
  botProgressBar.style.width = "0%";
  accelerateButton.disabled = true;
  moveLeftButton.disabled = true;
  moveRightButton.disabled = true;
  lookLeftButton.disabled = true;
  lookRightButton.disabled = true;
  speedReadout.innerHTML = "000 <em>KM/H</em>";
  boostMeterFill.style.width = "100%";
  telemetryGear.textContent = "N";
  telemetryRpm.style.width = "4%";
  road.style.setProperty("--streak-opacity", "0");
  playerWrap.classList.remove("boosting");
  nitroButton.disabled = true;
  nitroButton.classList.remove("ready");
  nitroButton.innerHTML = 'NITRO <span>SHIFT</span>';
  boostPads.forEach((pad) => (pad.style.display = ""));
  nitroPickups.forEach((pickup) => (pickup.style.display = ""));
  resultModal.classList.add("hidden");
  resetRewardPanel();
  countdown.classList.remove("hidden");
  countdown.textContent = "3";
  instruction.textContent = "Prepárate... ¡acelera con ESPACIO!";
}

function startCountdown() {
  const numbers = ["3", "2", "1", "¡YA!"];
  let index = 0;

  function next() {
    countdown.textContent = numbers[index];
    countdown.animate(
      [
        { opacity: 0, transform: "scale(1.35)" },
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(.78)" }
      ],
      { duration: 700, easing: "ease-out" }
    );

    if (index < numbers.length - 1) {
      index += 1;
      countdownTimer = window.setTimeout(next, 760);
      return;
    }

    countdownTimer = window.setTimeout(() => {
      countdown.classList.add("hidden");
      beginRace();
    }, 680);
  }

  next();
}

function setRaceRivals(groupRace = false) {
  activeGroupName = groupRace ? (group.name.trim() || "MI GRUPO") : "";
  activeRivalNames = groupRace ? [...group.members] : [...defaultBotNames];
  hudRivalsName.textContent = activeRivalNames.join(" · ");
  rivalsTag.textContent = activeGroupName ? activeGroupName.toUpperCase() : "RIVALES";
}

function openRace(groupRace = false) {
  if (groupRace) {
    syncGroupName();
    saveGroup();
    renderGroup();
  }

  if (groupRace && !group.members.length) return;

  setRaceRivals(groupRace);
  updateArtwork();
  setCarAppearance(raceCar);
  hudPlayerName.textContent = `${configuration.label} ${configuration.colorName.split(" ")[0]}`;
  garageScreen.classList.add("hidden");
  raceScreen.classList.remove("hidden");
  resetRaceView();
  startCountdown();
}

function beginRace() {
  raceState = {
    running: true,
    playerDistance: 0,
    botDistances: activeRivalNames.map(() => 0),
    playerVelocity: 0,
    turbo: 100,
    lastTime: performance.now(),
    lastBoost: 0,
    boostFlashUntil: 0,
    nitroCharges: 0,
    lane: 0,
    hitObstacles: new Set(),
    usedRamps: new Set(),
    collectedPads: new Set(),
    collectedNitros: new Set(),
    botSkills: activeRivalNames.map((_, index) => 0.0108 + Math.random() * 0.0022 + index * 0.00015)
  };

  instruction.textContent = "¡Presiona ESPACIO para acelerar y A/D o ←/→ para esquivar!";
  accelerateButton.disabled = false;
  moveLeftButton.disabled = false;
  moveRightButton.disabled = false;
  lookLeftButton.disabled = false;
  lookRightButton.disabled = false;
  road.classList.add("racing");
  animationFrame = requestAnimationFrame(updateRace);
}

function boost() {
  if (!raceState?.running) return;

  const now = performance.now();
  const cooldown = 80;

  if (now - raceState.lastBoost < cooldown) return;
  raceState.lastBoost = now;

  const chassisBonus = configuration.speed / 74;
  const installedBoosterBonus = 1 + Math.log1p(configuration.boosterCount) * 0.42;
  const turboBoost = raceState.turbo > 8 ? 1.45 : 1;
  raceState.turbo = Math.max(0, raceState.turbo - 9);
  raceState.boostFlashUntil = now + 150;
  raceState.playerVelocity = Math.min(
    raceState.playerVelocity + (0.012 * chassisBonus * turboBoost * installedBoosterBonus),
    0.087 * chassisBonus * installedBoosterBonus
  );

  accelerateButton.animate(
    [{ transform: "scale(1)" }, { transform: "scale(.93)" }, { transform: "scale(1)" }],
    { duration: 120 }
  );
}

function activateNitro() {
  if (!raceState?.running || raceState.nitroCharges < 1) return;

  raceState.nitroCharges -= 1;
  raceState.turbo = Math.min(100, raceState.turbo + 35);
  const installedBoosterBonus = 1 + Math.log1p(configuration.boosterCount) * 0.42;
  raceState.playerVelocity = Math.min(
    raceState.playerVelocity + 0.065 * (configuration.speed / 74) * installedBoosterBonus,
    0.15 * (configuration.speed / 74) * installedBoosterBonus
  );
  raceState.boostFlashUntil = performance.now() + 1050;
  nitroButton.disabled = raceState.nitroCharges === 0;
  nitroButton.classList.toggle("ready", raceState.nitroCharges > 0);
  nitroButton.innerHTML = `NITRO ×${raceState.nitroCharges} <span>SHIFT</span>`;
  instruction.textContent = "¡NITRO ACTIVADO! Mantén el ritmo para conservar la velocidad.";
}

function moveCar(direction) {
  if (!raceState?.running) return;

  const nextLane = Math.max(-1, Math.min(1, raceState.lane + direction));
  if (nextLane === raceState.lane) return;

  raceState.lane = nextLane;
  playerWrap.style.bottom = `${42 + raceState.lane * 14}%`;
  playerWrap.animate(
    [
      { transform: "scale(.67) translateY(0)" },
      { transform: `scale(.67) translateY(${-direction * 18}px)` },
      { transform: "scale(.67) translateY(0)" }
    ],
    { duration: 180, easing: "ease-out" }
  );
  instruction.textContent = raceState.lane === -1 ? "CARRIL INFERIOR" : raceState.lane === 1 ? "CARRIL SUPERIOR" : "CARRIL CENTRAL";
}

function checkRamps(playerDistance) {
  trackRamps.forEach((ramp, index) => {
    const distance = Number(ramp.dataset.distance) * 10;
    const lane = Number(ramp.dataset.lane);

    if (
      Math.abs(playerDistance - distance) < 17 &&
      raceState.lane === lane &&
      !raceState.usedRamps.has(index)
    ) {
      raceState.usedRamps.add(index);
      ramp.classList.add("used");
      raceState.playerVelocity = Math.min(raceState.playerVelocity + 0.04, 0.15);
      raceState.turbo = Math.min(100, raceState.turbo + 18);
      raceState.boostFlashUntil = performance.now() + 820;
      playerWrap.classList.remove("jumping");
      void playerWrap.offsetWidth;
      playerWrap.classList.add("jumping");
      window.setTimeout(() => playerWrap.classList.remove("jumping"), 840);
      instruction.textContent = "¡SALTO PERFECTO! Ganaste velocidad y turbo.";
    }
  });
}

function setCamera(direction) {
  if (!raceState?.running) return;

  const className = direction === -1 ? "camera-left" : "camera-right";
  const button = direction === -1 ? lookLeftButton : lookRightButton;
  const wasActive = raceScene.classList.contains(className);

  raceScene.classList.remove("camera-left", "camera-right");
  lookLeftButton.classList.remove("active");
  lookRightButton.classList.remove("active");

  if (!wasActive) {
    raceScene.classList.add(className);
    button.classList.add("active");
    instruction.textContent = direction === -1 ? "VISTA LATERAL IZQUIERDA" : "VISTA LATERAL DERECHA";
  } else {
    instruction.textContent = "VISTA FRONTAL RESTAURADA";
  }
}

function checkObstacles(playerPercent) {
  trackObstacles.forEach((obstacle, index) => {
    const distance = Number(obstacle.dataset.distance);
    const lane = Number(obstacle.dataset.lane);

    if (playerPercent > distance + 4) {
      obstacle.classList.add("cleared");
    }

    if (
      Math.abs(playerPercent - distance) < 1.9 &&
      raceState.lane === lane &&
      !raceState.hitObstacles.has(index)
    ) {
      raceState.hitObstacles.add(index);
      obstacle.classList.add("hit");
      raceState.playerVelocity *= 0.38;
      raceState.turbo = Math.max(0, raceState.turbo - 32);
      raceState.boostFlashUntil = 0;
      playerWrap.classList.remove("boosting");
      playerWrap.animate(
        [
          { transform: "scale(.67) translateX(0)" },
          { transform: "scale(.67) translateX(-20px) rotate(-4deg)" },
          { transform: "scale(.67) translateX(12px) rotate(3deg)" },
          { transform: "scale(.67) translateX(0)" }
        ],
        { duration: 420, easing: "ease-out" }
      );
      instruction.textContent = "¡CHOQUE! Pierdes velocidad y turbo. ¡Cambia de carril!";
    }
  });
}

function collectTrackItems(playerPercent) {
  const padThresholds = [38, 67];
  const nitroThresholds = [51, 77];

  padThresholds.forEach((threshold, index) => {
    if (playerPercent >= threshold && !raceState.collectedPads.has(index)) {
      raceState.collectedPads.add(index);
      boostPads[index].style.display = "none";
      raceState.turbo = Math.min(100, raceState.turbo + 26);
      raceState.playerVelocity = Math.min(raceState.playerVelocity + 0.028, 0.12);
      raceState.boostFlashUntil = performance.now() + 500;
      instruction.textContent = "¡PLATAFORMA BOOST! Turbo y velocidad aumentados.";
    }
  });

  nitroThresholds.forEach((threshold, index) => {
    if (playerPercent >= threshold && !raceState.collectedNitros.has(index)) {
      raceState.collectedNitros.add(index);
      nitroPickups[index].style.display = "none";
      raceState.nitroCharges = Math.min(2, raceState.nitroCharges + 1);
      nitroButton.disabled = false;
      nitroButton.classList.add("ready");
      nitroButton.innerHTML = `NITRO ×${raceState.nitroCharges} <span>SHIFT</span>`;
      instruction.textContent = "¡CÁPSULA N RECIBIDA! Presiona SHIFT para un gran impulso.";
    }
  });
}

function updateRace(now) {
  if (!raceState?.running) return;

  const delta = Math.min(now - raceState.lastTime, 50);
  raceState.lastTime = now;

  raceState.playerVelocity = Math.max(0.0035, raceState.playerVelocity - delta * 0.000011);
  raceState.turbo = Math.min(100, raceState.turbo + delta * 0.009);
  raceState.playerDistance += raceState.playerVelocity * (delta / 16.67);

  const speedKmh = Math.round(Math.min(320, 38 + raceState.playerVelocity * 3050));
  const gear = speedKmh < 55 ? 1 : speedKmh < 95 ? 2 : speedKmh < 145 ? 3 : speedKmh < 205 ? 4 : speedKmh < 265 ? 5 : 6;
  const rpm = Math.min(100, 9 + raceState.playerVelocity * 1300 + (now < raceState.boostFlashUntil ? 15 : 0));
  speedReadout.innerHTML = `${String(speedKmh).padStart(3, "0")} <em>KM/H</em>`;
  telemetryGear.textContent = gear;
  telemetryRpm.style.width = `${rpm}%`;
  boostMeterFill.style.width = `${raceState.turbo}%`;
  road.style.setProperty("--streak-opacity", String(Math.min(0.52, raceState.playerVelocity * 5)));
  playerWrap.classList.toggle("boosting", now < raceState.boostFlashUntil);

  raceState.botDistances = raceState.botDistances.map((distance, index) => {
    const pulse = Math.sin(now / (350 + index * 85) + index) * 0.0013;
    return distance + (raceState.botSkills[index] + pulse) * (delta / 16.67);
  });

  const raceLength = 1800;
  const playerDistance = Math.min(raceLength, raceState.playerDistance * 18);
  const botDistances = raceState.botDistances.map((distance) => Math.min(raceLength, distance * 18));
  const playerPercent = (playerDistance / raceLength) * 100;
  const botPercents = botDistances.map((distance) => (distance / raceLength) * 100);
  const leadingBotPercent = Math.max(...botPercents);
  collectTrackItems(playerPercent);
  checkObstacles(playerPercent);
  checkRamps(playerDistance);
  playerProgressBar.style.width = `${playerPercent}%`;
  botProgressBar.style.width = `${leadingBotPercent}%`;

  // La pista muestra una porción de los 1800 m de recorrido.
  playerWrap.style.left = `${10 + playerPercent * 0.72}%`;
  botWraps.forEach((botWrap, index) => {
    botWrap.style.left = `${8 + index * 2 + botPercents[index] * 0.72}%`;
  });

  if (playerDistance >= raceLength || Math.max(...botDistances) >= raceLength) {
    const leadingBotIndex = botPercents.indexOf(leadingBotPercent);
    finishRace(playerDistance >= raceLength && playerDistance >= Math.max(...botDistances), activeRivalNames[leadingBotIndex]);
    return;
  }

  animationFrame = requestAnimationFrame(updateRace);
}

function finishRace(playerWon, winningBot = "NEON-X") {
  raceState.running = false;
  cancelAnimationFrame(animationFrame);
  road.classList.remove("racing");
  playerWrap.classList.remove("boosting");
  accelerateButton.disabled = true;
  moveLeftButton.disabled = true;
  moveRightButton.disabled = true;
  lookLeftButton.disabled = true;
  lookRightButton.disabled = true;

  if (playerWon) {
    resultKicker.textContent = "VICTORIA";
    resultTitle.textContent = "¡GANASTE!";
    resultText.textContent = `Tu máquina cruzó la meta antes que ${activeRivalNames.join(", ")}. ¡El garaje tiene un nuevo campeón!`;
    awardVictoryReward();
  } else {
    resetRewardPanel();
    againButton.innerHTML = "VOLVER AL GARAJE <span>↺</span>";
    resultKicker.textContent = "CASI...";
    resultTitle.textContent = `¡${winningBot} GANÓ!`;
    resultText.textContent = `${winningBot} llegó primero. Ajusta el diseño, acelera más rápido y vuelve a intentarlo.`;
  }

  window.setTimeout(() => resultModal.classList.remove("hidden"), 500);
}

raceButton.addEventListener("click", () => openRace(false));
groupRaceButton.addEventListener("click", () => openRace(true));
addMemberButton.addEventListener("click", addGroupMember);
saveGroupButton.addEventListener("click", () => {
  syncGroupName();
  saveGroup();
  renderGroup();
  groupStatus.textContent = group.members.length
    ? `${group.name || "TU GRUPO"} fue guardado correctamente.`
    : "Guarda un nombre y agrega pilotos para crear el grupo.";
});
memberNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addGroupMember();
  }
});
accelerateButton.addEventListener("click", boost);
nitroButton.addEventListener("click", activateNitro);
moveLeftButton.addEventListener("click", () => moveCar(-1));
moveRightButton.addEventListener("click", () => moveCar(1));
lookLeftButton.addEventListener("click", () => setCamera(-1));
lookRightButton.addEventListener("click", () => setCamera(1));

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !raceScreen.classList.contains("hidden")) {
    event.preventDefault();
    boost();
  }

  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    activateNitro();
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    event.preventDefault();
    moveCar(-1);
  }

  if (event.code === "ArrowRight" || event.code === "KeyD") {
    event.preventDefault();
    moveCar(1);
  }

  if (event.code === "KeyQ") {
    event.preventDefault();
    setCamera(-1);
  }

  if (event.code === "KeyE") {
    event.preventDefault();
    setCamera(1);
  }
});

againButton.addEventListener("click", () => {
  resetRaceView();
  raceScreen.classList.add("hidden");
  garageScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

updateCredits();
updateGarage();
loadGroup();
