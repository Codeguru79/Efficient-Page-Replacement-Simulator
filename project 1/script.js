let events = [];
let totals = {};
let currentIndex = -1;
let playTimer = null;
let speed = 600;

const tableBody = document.querySelector("#resultTable tbody");
const summary = document.getElementById("summary");
const currentStep = document.getElementById("currentStep");
const currentPage = document.getElementById("currentPage");
const currentStatus = document.getElementById("currentStatus");

document.getElementById("speedRange").addEventListener("input", (e) => {
    speed = parseInt(e.target.value);
    document.getElementById("speedValue").innerText = speed;
});

document.getElementById("prepareBtn").addEventListener("click", prepareSimulation);
document.getElementById("playBtn").addEventListener("click", startPlay);
document.getElementById("pauseBtn").addEventListener("click", pause);
document.getElementById("stepForwardBtn").addEventListener("click", stepForward);
document.getElementById("stepBackBtn").addEventListener("click", stepBack);
document.getElementById("resetBtn").addEventListener("click", resetAll);


function prepareSimulation() {
    pause();
    tableBody.innerHTML = "";
    events = [];
    currentIndex = -1;

    let refString = document.getElementById("referenceInput").value.trim();
    let framesCount = parseInt(document.getElementById("framesInput").value);
    let algo = document.getElementById("algorithmSelect").value;

    if (!refString || !framesCount || framesCount < 1) {
        alert("Enter valid inputs!");
        return;
    }

    let pages = refString.split(/\s+/).map(Number);
    let frames = new Array(framesCount).fill(null);
    let lru = [];
    let fifoIdx = 0;

    let hits = 0, faults = 0;

    for (let i = 0; i < pages.length; i++) {
        let p = pages[i];
        let hit = false;
        let evicted = "-";

        if (algo === "fifo") {
            if (frames.includes(p)) {
                hit = true;
                hits++;
            } else {
                faults++;
                if (frames.includes(null)) {
                    frames[frames.indexOf(null)] = p;
                } else {
                    evicted = frames[fifoIdx];
                    frames[fifoIdx] = p;
                    fifoIdx = (fifoIdx + 1) % framesCount;
                }
            }
        }

        if (algo === "lru") {
            if (frames.includes(p)) {
                hit = true;
                hits++;
                lru.splice(lru.indexOf(p), 1);
                lru.push(p);
            } else {
                faults++;
                if (frames.includes(null)) {
                    frames[frames.indexOf(null)] = p;
                } else {
                    let victim = lru.shift();
                    evicted = victim;
                    frames[frames.indexOf(victim)] = p;
                }
                lru.push(p);
            }
        }

        if (algo === "optimal") {
            if (frames.includes(p)) {
                hit = true;
                hits++;
            } else {
                faults++;
                if (frames.includes(null)) {
                    frames[frames.indexOf(null)] = p;
                } else {
                    let farthest = -1, victim = null;
                    frames.forEach(f => {
                        let idx = pages.slice(i + 1).indexOf(f);
                        if (idx === -1) idx = 99999;
                        if (idx > farthest) {
                            farthest = idx;
                            victim = f;
                        }
                    });
                    evicted = victim;
                    frames[frames.indexOf(victim)] = p;
                }
            }
        }

        events.push({
            step: i,
            page: p,
            frames: [...frames],
            hit: hit,
            evicted: evicted
        });
    }

    totals = {
        total: pages.length,
        hits,
        faults
    };

    summary.innerHTML = `
        Prepared Successfully!<br>
        Total Pages: ${pages.length}<br>
        Hits: ${hits} | Faults: ${faults}
    `;
}
function startPlay() {
    pause();
    playTimer = setInterval(() => {
        stepForward();
    }, speed);
}

function pause() {
    if (playTimer) clearInterval(playTimer);
    playTimer = null;
}

function stepForward() {
    if (currentIndex >= events.length - 1) return;
    currentIndex++;
    renderRow(currentIndex);
}

function stepBack() {
    if (currentIndex < 0) return;

    tableBody.removeChild(tableBody.lastChild);
    currentIndex--;
    updateStatus();
}

function resetAll() {
    pause();
    events = [];
    currentIndex = -1;
    tableBody.innerHTML = "";
    summary.innerHTML = "";
    currentStep.innerText = "-";
    currentPage.innerText = "-";
    currentStatus.innerText = "-";
}

function renderRow(i) {
    let ev = events[i];

    let row = document.createElement("tr");
    row.className = ev.hit ? "hit active" : "miss active";

    row.innerHTML = `
        <td>${ev.step}</td>
        <td>${ev.page}</td>
        <td>[${ev.frames.join(", ")}]</td>
        <td>${ev.hit ? "Hit" : "Miss"}</td>
        <td>${ev.evicted}</td>
    `;

    let framesCell = row.children[2];
    if (!ev.hit) framesCell.classList.add("flash");

    tableBody.appendChild(row);

    setTimeout(() => row.classList.remove("active"), 300);

    updateStatus();
}

function updateStatus() {
    if (currentIndex < 0) {
        currentStep.innerText = "-";
        currentPage.innerText = "-";
        currentStatus.innerText = "-";
        return;
    }

    let ev = events[currentIndex];
    currentStep.innerText = ev.step;
    currentPage.innerText = ev.page;
    currentStatus.innerText = ev.hit ? "Hit" : "Miss";
}

