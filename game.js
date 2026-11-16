/* The Museum of Us — top-down pixel RPG engine. No libraries required. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const mapCanvas = $('mini-map');
  const mapCtx = mapCanvas.getContext('2d');
  const musicPlayer = $('background-music');
  const musicTrack = $('jukebox-track');
  const musicFiles = $('jukebox-files');
  const musicStatus = $('jukebox-status');
  const musicPlaylist = [];
  const portrait = $('portrait').getContext('2d');
  const TILE = 32, COLS = 36, ROWS = 24, WORLD_W = COLS * TILE, WORLD_H = ROWS * TILE;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const fill = (s) => String(s).replace(/\{her\}/g, CONFIG.herName).replace(/\{you\}/g, CONFIG.yourName);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  const exhibitSpots = [
    { x: 7.5 * TILE, y: 5.0 * TILE }, { x: 13 * TILE, y: 5.0 * TILE },
    { x: 18.5 * TILE, y: 5.0 * TILE }, { x: 24 * TILE, y: 5.0 * TILE },
    { x: 29.5 * TILE, y: 5.0 * TILE }, { x: 7.5 * TILE, y: 17.0 * TILE },
    { x: 13 * TILE, y: 17.0 * TILE }, { x: 18.5 * TILE, y: 17.0 * TILE },
  ];
  const finaleSpot = { x: 28.5 * TILE, y: 17 * TILE };
  const guide = { x: 5.3 * TILE, y: 8.0 * TILE };
  const player = { x: 4.0 * TILE, y: 8.0 * TILE, speed: 118, direction: 'down', moving: false, walkFrame: 0, destination: null };
  const keys = new Set();
  const touchKeys = new Set();
  const visited = new Set();
  const artworkLayer = $('artwork-layer');
  const artworkImages = CONFIG.exhibits.map((ex) => {
    const img = document.createElement('img');
    img.className = 'artwork-image';
    img.alt = '';
    img.src = ex.img;
    artworkLayer.appendChild(img);
    return img;
  });
  const stops = [
    { title: CONFIG.lobby.title, tag: 'MUSEUM GUIDE', text: fill(CONFIG.lobby.story), point: { x: guide.x + 35, y: guide.y + 38 } },
    ...CONFIG.exhibits.map((ex, i) => ({ title: ex.title, tag: `${ex.date} · EXHIBIT ${i + 1}`, text: fill(ex.story), point: { x: exhibitSpots[i].x - 30, y: exhibitSpots[i].y + 37 } })),
    { title: CONFIG.finale.title, tag: CONFIG.finale.date, text: fill(CONFIG.finale.story), point: { x: finaleSpot.x - 40, y: finaleSpot.y + 48 } },
  ];
  const FINAL = stops.length - 1;
  let currentStop = -1;
  let nearby = null;
  let started = false;
  let voiceOn = true;
  let autoTour = false;
  let ceremonyDone = false;
  let autoTimer = null;
  let lastTime = performance.now();
  let clock = 0;
  let dialogueToken = 0;
  let particles = [];
  let camera = { x: 0, y: 0 };
  let speechVoice = null;
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices().filter((v) => /^en/i.test(v.lang));
    const maleHints = /david|guy|mark|alex|daniel|james|christopher|eric|matthew|aaron|tom|ryan|fred|jorge|thomas|male/i;
    const femaleHints = /samantha|zira|jenny|aria|karen|moira|tessa|susan|female|victoria|google uk english female/i;
    speechVoice = voices.find((v) => maleHints.test(v.name) && !femaleHints.test(v.name))
      || voices.find((v) => /en[-_]US/i.test(v.lang) && !femaleHints.test(v.name))
      || voices.find((v) => !femaleHints.test(v.name)) || voices[0] || null;
  }
  if (synth) { pickVoice(); synth.addEventListener?.('voiceschanged', pickVoice); synth.onvoiceschanged = pickVoice; }

  function speak(text) {
    if (!voiceOn || !synth) return;
    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (speechVoice) { utterance.voice = speechVoice; utterance.lang = speechVoice.lang; }
      else utterance.lang = CONFIG.guide.voice.language || 'en-US';
      utterance.rate = CONFIG.guide.voice.rate || 1.04;
      utterance.pitch = CONFIG.guide.voice.pitch || 0.92;
      utterance.volume = 1;
      synth.speak(utterance);
    } catch (_) { /* Text dialogue remains available if speech is unsupported. */ }
  }
  function stopSpeech() { if (synth) { try { synth.cancel(); } catch (_) {} } }
  function setVoice(on) {
    voiceOn = !!on;
    $('voice-toggle').textContent = `VOICE: ${voiceOn ? 'ON' : 'OFF'}`;
    $('start-voice').textContent = voiceOn ? 'ON' : 'OFF';
    if (!voiceOn) stopSpeech();
  }

  function playMusicTrack(index) {
    if (!musicPlaylist.length) return;
    musicTrack.selectedIndex = index;
    musicPlayer.src = musicPlaylist[index].url;
    musicPlayer.load();
    musicPlayer.play().then(() => {
      musicStatus.textContent = `Now playing: ${musicPlaylist[index].name}`;
    }).catch(() => {
      musicStatus.textContent = `Couldn't play "${musicPlaylist[index].name}". Try another audio file or press play.`;
    });
  }

  musicFiles.addEventListener('change', () => {
    const selectedFiles = Array.from(musicFiles.files || []);
    const filesToAdd = selectedFiles;
    if (filesToAdd.length && musicPlaylist.length === 0) musicTrack.options.length = 0;
    filesToAdd.forEach((file) => {
      const url = URL.createObjectURL(file);
      musicPlaylist.push({ name: file.name, url });
      const option = document.createElement('option');
      option.value = String(musicPlaylist.length - 1);
      option.textContent = file.name;
      musicTrack.appendChild(option);
    });
    musicFiles.value = '';
    musicTrack.disabled = musicPlaylist.length === 0;
    $('jukebox-clear').disabled = musicPlaylist.length === 0;
    if (filesToAdd.length) {
      playMusicTrack(musicPlaylist.length - filesToAdd.length);
    }
  });

  $('jukebox-clear').addEventListener('click', () => {
    musicPlayer.pause();
    musicPlayer.removeAttribute('src');
    musicPlayer.load();
    musicPlaylist.forEach((track) => URL.revokeObjectURL(track.url));
    musicPlaylist.length = 0;
    while (musicTrack.firstChild) musicTrack.removeChild(musicTrack.firstChild);
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'No songs added';
    musicTrack.appendChild(emptyOption);
    musicTrack.disabled = true;
    $('jukebox-clear').disabled = true;
    musicStatus.textContent = 'Playlist cleared. Choose audio files from your device to start again.';
  });

  musicTrack.addEventListener('change', () => {
    const index = Number(musicTrack.value);
    if (Number.isInteger(index) && musicPlaylist[index]) playMusicTrack(index);
  });
  musicPlayer.addEventListener('ended', () => {
    if (musicPlaylist.length > 1) {
      playMusicTrack((musicTrack.selectedIndex + 1) % musicPlaylist.length);
    } else if (musicPlaylist.length === 1) {
      playMusicTrack(0);
    }
  });
  musicPlayer.addEventListener('error', () => {
    if (musicPlaylist.length) musicStatus.textContent = 'This audio file could not be played. Try another file format.';
  });
  window.addEventListener('beforeunload', () => {
    musicPlaylist.forEach((track) => URL.revokeObjectURL(track.url));
  });

  function drawPortrait() {
    portrait.clearRect(0, 0, 64, 64);
    portrait.fillStyle = '#6b496e'; portrait.fillRect(0, 0, 64, 64);
    portrait.fillStyle = '#d9bd77'; portrait.fillRect(5, 5, 54, 54);
    // Pixel-art curator portrait.
    portrait.fillStyle = '#4a2b27'; portrait.fillRect(16, 8, 32, 12); portrait.fillRect(12, 15, 8, 12); portrait.fillRect(44, 15, 8, 12);
    portrait.fillStyle = '#e6a77f'; portrait.fillRect(16, 18, 32, 29); portrait.fillRect(12, 26, 4, 11); portrait.fillRect(48, 26, 4, 11);
    portrait.fillStyle = '#4a2b27'; portrait.fillRect(17, 15, 30, 7); portrait.fillRect(17, 22, 5, 5); portrait.fillRect(42, 22, 5, 5);
    portrait.fillStyle = '#21172b'; portrait.fillRect(23, 29, 4, 4); portrait.fillRect(38, 29, 4, 4);
    portrait.fillStyle = '#b85f65'; portrait.fillRect(29, 39, 8, 3);
    portrait.fillStyle = '#3d668a'; portrait.fillRect(12, 47, 40, 14); portrait.fillRect(8, 54, 48, 10);
    portrait.fillStyle = '#f5cf75'; portrait.fillRect(29, 48, 6, 9);
  }

  function floorColor(tx, ty) {
    if (tx < 2 || ty < 2 || tx > COLS - 3 || ty > ROWS - 3) return '#30223c';
    if (ty >= 10 && ty <= 13 && tx >= 3 && tx <= 32) return ((tx + ty) % 2) ? '#7b3158' : '#8d3d62';
    return ((tx + ty) % 2) ? '#6b5571' : '#715b78';
  }
  function drawFloor() {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const x = tx * TILE, y = ty * TILE;
        ctx.fillStyle = floorColor(tx, ty); ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,.045)'; ctx.fillRect(x + 3, y + 3, 2, 2);
        if ((tx * 7 + ty * 13) % 17 === 0) { ctx.fillStyle = 'rgba(23,13,31,.13)'; ctx.fillRect(x + 19, y + 21, 4, 3); }
      }
    }
    // Border walls and warm gold skirting.
    for (let tx = 1; tx < COLS - 1; tx++) {
      drawWall(tx * TILE, 1 * TILE); drawWall(tx * TILE, (ROWS - 2) * TILE);
    }
    for (let ty = 2; ty < ROWS - 2; ty++) {
      drawWall(1 * TILE, ty * TILE); drawWall((COLS - 2) * TILE, ty * TILE);
    }
    // Gallery carpet and central medallion.
    ctx.fillStyle = '#a34b70'; ctx.fillRect(4 * TILE, 10 * TILE, 28 * TILE, 4 * TILE);
    ctx.fillStyle = '#e8c778'; ctx.fillRect(4 * TILE, 10 * TILE, 28 * TILE, 3);
    ctx.fillRect(4 * TILE, 14 * TILE - 3, 28 * TILE, 3);
    ctx.fillStyle = '#d7ad62'; ctx.fillRect(16 * TILE - 3, 10 * TILE + 12, 6, 104);
    ctx.fillStyle = '#f4d88d'; ctx.fillRect(16 * TILE - 1, 10 * TILE + 24, 2, 80);
    // Plants and pillars.
    [[3,3],[32,3],[3,20],[32,20],[17,3],[17,20]].forEach(([tx,ty],i)=>drawPlant(tx*TILE+16,ty*TILE+16,i));
    // Wall lights.
    [7,13,19,25,30].forEach((tx)=>{ctx.fillStyle='#f5d78b';ctx.fillRect(tx*TILE+10,2*TILE+2,12,4);ctx.fillStyle='rgba(255,218,132,.16)';ctx.fillRect(tx*TILE+4,2*TILE+6,24,10);});
    // Entrance door.
    ctx.fillStyle='#3b2748'; ctx.fillRect(4*TILE,21*TILE,3*TILE,2*TILE);
    ctx.fillStyle='#d7ad62'; ctx.fillRect(4*TILE,21*TILE,3*TILE,4); ctx.fillRect(4*TILE,21*TILE,4,2*TILE);
    ctx.fillStyle='#f0d68d'; ctx.fillRect(5*TILE+8,22*TILE+5,3,3);
  }
  function drawWall(x,y) {
    ctx.fillStyle='#39294a';ctx.fillRect(x,y,TILE,TILE);
    ctx.fillStyle='#594166';ctx.fillRect(x+2,y+2,TILE-4,5);
    ctx.fillStyle='#d6b36e';ctx.fillRect(x,y+TILE-5,TILE,5);
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x+TILE-4,y,4,TILE);
  }
  function drawPlant(x,y,variant=0) {
    ctx.fillStyle='rgba(12,9,18,.35)';ctx.fillRect(x-11,y+8,24,5);
    ctx.fillStyle='#875337';ctx.fillRect(x-7,y+2,15,11);ctx.fillStyle='#d39b61';ctx.fillRect(x-5,y+2,11,3);
    const greens=['#43814b','#57934f','#35794a'];ctx.fillStyle=greens[variant%3];
    ctx.fillRect(x-12,y-9,10,11);ctx.fillRect(x+2,y-12,11,13);ctx.fillRect(x-5,y-18,11,12);
    ctx.fillStyle='#8ec36b';ctx.fillRect(x-8,y-8,3,3);ctx.fillRect(x+5,y-11,3,3);
  }
  function drawExhibit(ex, i, x, y, time) {
    // Drop shadow, pedestal, framed artwork, plaque, and a soft pixel sparkle.
    ctx.fillStyle='rgba(10,6,15,.35)';ctx.fillRect(x-23,y+18,48,7);
    ctx.fillStyle='#d6b36e';ctx.fillRect(x-22,y-7,44,30);
    ctx.fillStyle='#8b6338';ctx.fillRect(x-19,y-4,38,23);
    ctx.fillStyle='#f4dfab';ctx.fillRect(x-16,y-2,32,19);
    const pal=[['#e78db6','#a45cb0'],['#e5a45e','#d35d78'],['#79b9c6','#6e6ab5'],['#e7d17b','#d97972'],['#83c99e','#477ca2'],['#c0a0d9','#6c4a91'],['#e7a0b4','#b64f6c'],['#f1cc72','#e77d9d']][i%8];
    ctx.fillStyle=pal[0];ctx.fillRect(x-13,y+1,26,13);ctx.fillStyle=pal[1];ctx.fillRect(x-13,y+9,26,5);
    ctx.fillStyle='#fff1ce';ctx.font='13px monospace';ctx.textAlign='center';ctx.fillText(ex.emoji,x,y+12);
    ctx.fillStyle='#e9d4a1';ctx.fillRect(x-20,y+24,40,5);ctx.fillStyle='#4b354f';ctx.fillRect(x-16,y+25,32,3);
    if (currentStop === i+1 || (nearby && nearby.type==='exhibit' && nearby.index===i)) {
      ctx.strokeStyle='#9cf0d5';ctx.lineWidth=2;ctx.strokeRect(x-26,y-11,52,47);
      const sparkleY = y-16-Math.sin(time*3+i)*2;
      ctx.fillStyle='#fff2b0';ctx.fillRect(x-2,sparkleY,4,4);
    }
  }
  function drawFinale(x,y,time) {
    ctx.fillStyle='rgba(10,6,15,.4)';ctx.fillRect(x-34,y+24,68,8);
    ctx.fillStyle='#d7b56f';ctx.fillRect(x-30,y-8,60,34);
    ctx.fillStyle='#8b6338';ctx.fillRect(x-26,y-4,52,26);
    ctx.fillStyle='#5d376e';ctx.fillRect(x-22,y,44,18);
    ctx.fillStyle='#ff8dbd';ctx.font='bold 26px serif';ctx.textAlign='center';ctx.fillText('♥',x,y+17+Math.sin(time*2)*2);
    ctx.fillStyle='#f7d98d';ctx.fillRect(x-23,y+27,46,6);
    ctx.fillStyle='#fff1c0';ctx.fillRect(x-3,y-21,6,5);ctx.fillRect(x-16,y-15,4,4);ctx.fillRect(x+12,y-15,4,4);
    if (currentStop===FINAL || (nearby && nearby.type==='finale')) {ctx.strokeStyle='#9cf0d5';ctx.lineWidth=2;ctx.strokeRect(x-34,y-28,68,66);}
  }
  function drawCharacter(x,y,kind,frame=0,dir='down') {
    const bob = frame ? Math.sin(frame*12)*1.5 : 0;
    ctx.fillStyle='rgba(8,5,12,.35)';ctx.fillRect(x-9,y+10,18,5);
    if (kind==='guide') {
      ctx.fillStyle='#3b2a29';ctx.fillRect(x-8,y-13+bob,16,10);ctx.fillRect(x-11,y-8+bob,4,8);ctx.fillRect(x+7,y-8+bob,4,8);
      ctx.fillStyle='#e6ad87';ctx.fillRect(x-7,y-5+bob,14,12);ctx.fillStyle='#33212a';ctx.fillRect(x-5,y-2+bob,3,3);ctx.fillRect(x+3,y-2+bob,3,3);
      ctx.fillStyle='#416b91';ctx.fillRect(x-9,y+7+bob,18,9);ctx.fillStyle='#f4d27e';ctx.fillRect(x-2,y+7+bob,4,7);
      ctx.fillStyle='#f3d88c';ctx.fillRect(x-11,y+15+bob,8,4);ctx.fillRect(x+3,y+15+bob,8,4);
    } else {
      ctx.fillStyle='#59372b';ctx.fillRect(x-8,y-14+bob,16,10);ctx.fillRect(x-10,y-9+bob,4,8);ctx.fillRect(x+6,y-9+bob,4,8);
      ctx.fillStyle='#e9b08a';ctx.fillRect(x-7,y-5+bob,14,12);
      ctx.fillStyle='#4b2e2c';if(dir==='left'){ctx.fillRect(x-7,y-3+bob,3,3)}else if(dir==='right'){ctx.fillRect(x+4,y-3+bob,3,3)}else{ctx.fillRect(x-5,y-3+bob,3,3);ctx.fillRect(x+3,y-3+bob,3,3)}
      ctx.fillStyle='#a85f62';ctx.fillRect(x-2,y+3+bob,4,2);
      ctx.fillStyle='#3e759b';ctx.fillRect(x-9,y+7+bob,18,10);ctx.fillStyle='#e7c66f';ctx.fillRect(x-2,y+7+bob,4,8);
      ctx.fillStyle='#d9bd8a';ctx.fillRect(x-8,y+16+bob,6,4);ctx.fillRect(x+2,y+16+bob,6,4);
    }
  }
  function drawWorld(time) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const targetX = clamp(player.x - canvas.width/2,0,WORLD_W-canvas.width);
    const targetY = clamp(player.y - canvas.height/2,0,WORLD_H-canvas.height);
    camera.x += (targetX-camera.x)*0.12; camera.y += (targetY-camera.y)*0.12;
    positionArtworkImages();
    ctx.save();ctx.translate(-Math.round(camera.x),-Math.round(camera.y));
    drawFloor();
    exhibitSpots.forEach((p,i)=>drawExhibit(CONFIG.exhibits[i],i,p.x,p.y,time));
    drawFinale(finaleSpot.x,finaleSpot.y,time);
    drawCharacter(guide.x,guide.y,'guide',0,'down');
    drawCharacter(player.x,player.y,'player',player.moving?player.walkFrame:0,player.direction);
    particles.forEach((p)=>{
      const rise = p.age*15;
      ctx.globalAlpha=clamp(1-p.age/p.life,0,1);
      ctx.fillStyle=p.mine?'#ff9ac4':'#ffe39a';ctx.fillRect(p.x-3,p.y-rise-4,6,6);
      ctx.fillStyle='#fff8db';ctx.fillRect(p.x-1,p.y-rise-2,2,2);
    });ctx.globalAlpha=1;
    if (nearby) {
      const target=nearby.type==='guide'?guide:nearby.type==='finale'?finaleSpot:exhibitSpots[nearby.index];
      const label=nearby.type==='guide'?'TALK':nearby.type==='finale'?'WISH':'VIEW';
      ctx.fillStyle='#20152f';ctx.fillRect(target.x-18,target.y-38,36,13);ctx.fillStyle='#fff2c8';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(label,target.x,target.y-29);
    }
    ctx.restore();
  }
  function positionArtworkImages() {
    const scaleX = canvas.clientWidth / canvas.width;
    const scaleY = canvas.clientHeight / canvas.height;
    artworkImages.forEach((img, i) => {
      const spot = exhibitSpots[i];
      img.style.left = `${(spot.x - 11 - Math.round(camera.x)) * scaleX}px`;
      img.style.top = `${(spot.y + 2 - Math.round(camera.y)) * scaleY}px`;
      img.style.width = `${22 * scaleX}px`;
      img.style.height = `${12 * scaleY}px`;
      img.style.display = img.complete && img.naturalWidth ? 'block' : 'none';
    });
  }
  function drawMiniMap() {
    const w=mapCanvas.width,h=mapCanvas.height;
    mapCtx.fillStyle='#21172e';mapCtx.fillRect(0,0,w,h);
    mapCtx.fillStyle='#6d5a76';mapCtx.fillRect(4,4,w-8,h-8);
    mapCtx.fillStyle='#a34b70';mapCtx.fillRect(12,31,w-24,12);
    const sx=(w-8)/WORLD_W,sy=(h-8)/WORLD_H;
    exhibitSpots.forEach((p,i)=>{mapCtx.fillStyle=visited.has(i+1)?'#f4d17d':'#ff8dbd';mapCtx.fillRect(4+p.x*sx-1,4+p.y*sy-1,4,4);});
    mapCtx.fillStyle=visited.has(FINAL)?'#9cf0d5':'#f5cf75';mapCtx.fillRect(4+finaleSpot.x*sx-2,4+finaleSpot.y*sy-2,5,5);
    mapCtx.fillStyle='#9cf0d5';mapCtx.fillRect(4+player.x*sx-2,4+player.y*sy-2,5,5);
    mapCtx.strokeStyle='#d8bd78';mapCtx.lineWidth=1;mapCtx.strokeRect(3.5,3.5,w-7,h-7);
  }
  function blocked(x,y) {
    const tx=x/TILE,ty=y/TILE;
    if(tx<2.2||ty<2.2||tx>COLS-2.2||ty>ROWS-2.2)return true;
    const obstacles=[guide,...exhibitSpots,finaleSpot];
    return obstacles.some((o)=>Math.hypot(x-o.x,y-o.y)<22);
  }
  function setDestination(x,y,callback) {
    player.destination={x:clamp(x,2.5*TILE,WORLD_W-2.5*TILE),y:clamp(y,2.5*TILE,WORLD_H-2.5*TILE)};
    player.arrival=callback||null;
  }
  function updateMovement(dt) {
    let dx=0,dy=0;
    const up=keys.has('ArrowUp')||keys.has('w')||touchKeys.has('up');
    const down=keys.has('ArrowDown')||keys.has('s')||touchKeys.has('down');
    const left=keys.has('ArrowLeft')||keys.has('a')||touchKeys.has('left');
    const right=keys.has('ArrowRight')||keys.has('d')||touchKeys.has('right');
    if(up)dy--;if(down)dy++;if(left)dx--;if(right)dx++;
    if(dx||dy){player.destination=null;player.arrival=null;const len=Math.hypot(dx,dy);dx/=len;dy/=len;}
    else if(player.destination){dx=player.destination.x-player.x;dy=player.destination.y-player.y;const len=Math.hypot(dx,dy);if(len<3){player.x=player.destination.x;player.y=player.destination.y;player.destination=null;const cb=player.arrival;player.arrival=null;if(cb)cb();dx=dy=0;}else{dx/=len;dy/=len;}}
    player.moving=!!(dx||dy);
    if(player.moving){
      if(Math.abs(dx)>Math.abs(dy))player.direction=dx<0?'left':'right';else player.direction=dy<0?'up':'down';
      const nx=player.x+dx*player.speed*dt,ny=player.y+dy*player.speed*dt;
      if(!blocked(nx,player.y))player.x=nx;
      if(!blocked(player.x,ny))player.y=ny;
      player.walkFrame+=dt*10;
    }
  }
  function findNearby() {
    const candidates=[{type:'guide',x:guide.x,y:guide.y},...exhibitSpots.map((p,index)=>({type:'exhibit',index,x:p.x,y:p.y})),{type:'finale',x:finaleSpot.x,y:finaleSpot.y}];
    let best=null,bestD=56;
    candidates.forEach((c)=>{const d=Math.hypot(player.x-c.x,player.y-c.y);if(d<bestD){best=c;bestD=d;}});
    nearby=best;
    const hint=$('interaction-hint');
    if(best){hint.classList.remove('hidden');hint.textContent=best.type==='guide'?'E  TALK TO CURATOR':best.type==='finale'?'E  VIEW THE FINAL PIECE':`E  VIEW ${CONFIG.exhibits[best.index].title.toUpperCase()}`;}
    else hint.classList.add('hidden');
  }
  function setObjective(text){$('objective').textContent=text;}
  function showDialogue(index) {
    currentStop=index;visited.add(index);
    const stop=stops[index];
    $('hud-room').textContent=index===0?'THE GRAND HALL':index===FINAL?'THE FUTURE ROOM':`GALLERY · ${index}/${CONFIG.exhibits.length}`;
    $('speaker-name').textContent=CONFIG.guide.name.toUpperCase();
    $('dialogue-tag').textContent=stop.tag;
    $('dialogue-text').textContent=stop.text;
    const exhibit = index > 0 && index < FINAL ? CONFIG.exhibits[index - 1] : null;
    const exhibitView = $('exhibit-view');
    const exhibitImage = $('exhibit-image');
    if (exhibit) {
      exhibitImage.onerror = () => exhibitView.classList.add('hidden');
      exhibitImage.alt = `${exhibit.title} — ${exhibit.caption}`;
      $('exhibit-caption').textContent = exhibit.title;
      exhibitView.classList.remove('hidden');
      exhibitImage.src = exhibit.img;
    } else {
      exhibitView.classList.add('hidden');
      exhibitImage.removeAttribute('src');
    }
    $('back-stop').disabled=index<=0;
    $('next-stop').textContent=index>=FINAL?(ceremonyDone?'↻ TOUR AGAIN':'MAKE A WISH ✦'):'NEXT ▶';
    setObjective(index===FINAL?'The final room is waiting. Make a wish when you are ready.':index===0?'Find the glowing frames and press E to explore each memory.':`Memory ${index} of ${CONFIG.exhibits.length} — explore the room or continue the guided tour.`);
    speak(stop.text);
    drawMiniMap();
    if(autoTour&&index<FINAL){clearTimeout(autoTimer);autoTimer=setTimeout(()=>{if(autoTour&&currentStop===index)goToStop(index+1);},11000);}
    if(index===FINAL){$('next-stop').textContent=ceremonyDone?'↻ TOUR AGAIN':'MAKE A WISH ✦';}
  }
  function goToStop(index) {
    if(index<0||index>FINAL)return;
    clearTimeout(autoTimer);
    const stop=stops[index];
    const arrive=()=>showDialogue(index);
    const point=stop.point;
    if(Math.hypot(player.x-point.x,player.y-point.y)<5)arrive();
    else setDestination(point.x,point.y,arrive);
    setObjective(index===FINAL?'Walking to the final room…':index===0?'Returning to the curator…':`Walking to ${CONFIG.exhibits[index-1].title}…`);
  }
  function interact() {
    if(!started)return;
    if(!nearby)return;
    if(nearby.type==='guide')showDialogue(0);
    else if(nearby.type==='exhibit')showDialogue(nearby.index+1);
    else showDialogue(FINAL);
  }
  function typeDialogue(text) {
    const token=++dialogueToken;const el=$('dialogue-text');el.textContent='';let i=0;
    const step=()=>{if(token!==dialogueToken)return;i+=2;el.textContent=text.slice(0,i);if(i<text.length)requestAnimationFrame(step);};requestAnimationFrame(step);
  }
  function replayCurrent(){if(currentStop<0)return;typeDialogue(stops[currentStop].text);speak(stops[currentStop].text);}
  function spawnWish(text,mine=false){
    const x=clamp(finaleSpot.x+rand(-110,110),100,WORLD_W-100),y=clamp(finaleSpot.y+rand(-45,45),100,WORLD_H-100);
    particles.push({x,y,text,age:0,life:9,mine});
  }
  async function wishCeremony(){
    if(currentStop!==FINAL)return;
    $('next-stop').disabled=true;setObjective('A few wishes are finding their way to the stars…');
    const intro=fill("Close your eyes for a moment, {her}, and let's open the sky.");
    $('dialogue-text').textContent=intro;speak(intro);await sleep(2800);
    for(const wish of CONFIG.finale.wishes){
      const line=fill(wish);spawnWish(line);$('dialogue-text').textContent=line;speak(line);await sleep(3200);
    }
    const after=fill(CONFIG.finale.afterWishes);$('dialogue-text').textContent=after;speak(after);await sleep(2600);
    ceremonyDone=true;$('next-stop').disabled=false;$('next-stop').textContent='↻ TOUR AGAIN';showLetter();
  }
  function showLetter(){
    $('letter-title').textContent=fill(CONFIG.finale.closingTitle);
    $('letter-body').textContent=fill(CONFIG.finale.closing);
    $('letter-overlay').classList.remove('hidden');
    speak('Here is a little letter for you.');
  }
  function restartTour(){
    ceremonyDone=false;visited.clear();particles=[];currentStop=-1;stopSpeech();
    player.x=guide.x+34;player.y=guide.y+34;player.destination=null;player.arrival=null;
    goToStop(0);
  }
  function showOwnWish(){
    $('wish-overlay').classList.remove('hidden');$('wish-input').value='';$('wish-input').focus();
  }
  function releaseOwnWish(){
    const value=$('wish-input').value.trim();if(!value)return;
    spawnWish(value,true);$('wish-overlay').classList.add('hidden');
    const line="What a beautiful wish. It's with the stars now. Take a screenshot and send it to "+CONFIG.yourName+", so you both remember it forever.";
    $('dialogue-text').textContent=line;speak(line);setObjective('Your wish is now part of the museum. Thank you for visiting!');
  }

  function drawFrame(now) {
    const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;clock+=dt;
    if(started){updateMovement(dt);findNearby();}
    particles.forEach((p)=>p.age+=dt);particles=particles.filter((p)=>p.age<p.life);
    drawWorld(clock);drawMiniMap();requestAnimationFrame(drawFrame);
  }

  function startGame(){
    if(started)return;started=true;$('start-screen').classList.add('hidden');
    if(synth&&voiceOn){try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;synth.speak(u);}catch(_){}}
    player.x=guide.x+34;player.y=guide.y+34;showDialogue(0);setObjective('Walk with WASD / arrow keys. Press E near a person or exhibit.');
  }

  document.addEventListener('keydown',(e)=>{
    if(e.target && (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'||e.target.closest('.jukebox')))return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    const key=e.key.length===1?e.key.toLowerCase():e.key;keys.add(key);
    if((key==='e'||key===' '||key==='Enter')&&!e.repeat&&$('start-screen').classList.contains('hidden')){interact();}
  });
  document.addEventListener('keyup',(e)=>{const key=e.key.length===1?e.key.toLowerCase():e.key;keys.delete(key);});
  window.addEventListener('blur',()=>{keys.clear();touchKeys.clear();});
  document.querySelectorAll('.dpad').forEach((button)=>{
    const dir=button.dataset.dir;
    button.addEventListener('pointerdown',(e)=>{e.preventDefault();touchKeys.add(dir);button.setPointerCapture?.(e.pointerId);});
    ['pointerup','pointercancel','lostpointercapture'].forEach((ev)=>button.addEventListener(ev,()=>touchKeys.delete(dir)));
  });
  $('touch-interact').addEventListener('click',interact);
  $('start-game').addEventListener('click',startGame);
  $('start-voice').addEventListener('click',()=>setVoice(!voiceOn));
  $('voice-toggle').addEventListener('click',()=>setVoice(!voiceOn));
  $('auto-toggle').addEventListener('click',()=>{autoTour=!autoTour;$('auto-toggle').textContent=`AUTO TOUR: ${autoTour?'ON':'OFF'}`;if(autoTour&&currentStop>=0&&currentStop<FINAL)autoTimer=setTimeout(()=>goToStop(currentStop+1),1800);else clearTimeout(autoTimer);});
  $('next-stop').addEventListener('click',()=>{if(currentStop>=FINAL){if(ceremonyDone)restartTour();else wishCeremony();return;}goToStop(currentStop+1);});
  $('back-stop').addEventListener('click',()=>goToStop(currentStop-1));
  $('replay-line').addEventListener('click',replayCurrent);
  $('letter-close').addEventListener('click',()=>{$('letter-overlay').classList.add('hidden');showOwnWish();});
  $('wish-release').addEventListener('click',releaseOwnWish);
  $('wish-skip').addEventListener('click',()=>{$('wish-overlay').classList.add('hidden');ceremonyDone=true;$('next-stop').textContent='↻ TOUR AGAIN';setObjective('Your museum tour is complete. You can keep exploring!');});
  $('wish-input').addEventListener('keydown',(e)=>{if(e.key==='Enter')releaseOwnWish();});

  // Mini-map click moves the player toward the selected point.
  mapCanvas.addEventListener('click',(e)=>{
    if(!started)return;const r=mapCanvas.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width*WORLD_W,y=(e.clientY-r.top)/r.height*WORLD_H;
    setDestination(x,y);setObjective('Finding your way through the museum…');
  });
  $('start-subtitle').textContent=`A pixel adventure for ${CONFIG.herName}`;
  $('letter-title').textContent=fill(CONFIG.finale.closingTitle);
  drawPortrait();setVoice(true);requestAnimationFrame(drawFrame);
})();
