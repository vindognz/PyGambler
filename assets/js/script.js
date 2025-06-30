isSpinning = false;
code = '';

document.addEventListener('DOMContentLoaded', () => {
    window.codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById('codeInput'), {
        mode: 'python',
        theme: 'vscode-dark', // You can use other themes too
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
    });

    window.codeMirrorEditor.on('change', (instance) => {
        const lineCount = instance.lineCount();
        const characterCount = instance.getValue().length;
        document.getElementById('tokenCount').textContent = Math.floor(lineCount * 10 + characterCount);
    });

    const gambleButton = document.getElementById('gambleButton');

    gambleButton.addEventListener('click', () => {
        if (isSpinning || document.getElementById('tokenCount').textContent === "0") return; // Prevent multiple clicks while spinning
        rollAll();
        beginGambleCode();
    });
})

const icon_width = 79,
      icon_height = 79,
      num_icons = 9,
      time_per_icon = 100,
      indexes = [0, 0, 0],
      icon_map = ["banana", "seven", "cherry", "plum", "orange", "bell", "bar", "lemon", "melon"];

const roll = (reel, offset = 0) => {
    // Pick a random icon to land on
    const targetIndex = Math.floor(Math.random() * num_icons);
    // Randomize number of full spins (cycles)
    const minSpins = 3 + offset;
    const maxSpins = 6 + offset;
    const spins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
    // Calculate the final background position
    const targetBackgroundPositionY = (spins * num_icons + targetIndex) * icon_height;
    const normTargetBackgroundPositionY = (targetIndex * icon_height) % (num_icons * icon_height);

    return new Promise((resolve) => {
        const duration = 1200 + Math.random() * 800 + offset * 200;
        reel.style.transition = `background-position-y ${duration}ms cubic-bezier(.45, .05, .58, 1.09)`;
        reel.style.backgroundPositionY = `${targetBackgroundPositionY}px`;

        setTimeout(() => {
            reel.style.transition = `none`;
            reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;
            resolve(targetIndex);
        }, duration);
    });
};

function scrambleText(text) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return text.split('').map(c => c.match(/\s/g) ? c : chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Animate scrambling and restoring the title
function animateTitleScramble(original, duration = 1200) {
    const titleElem = document.getElementById('titleContent');
    let frame = 0;
    const totalFrames = Math.floor(duration / 20);
    let scrambleInterval = setInterval(() => {
        titleElem.textContent = scrambleText(original);
        frame++;
        if (frame >= totalFrames) {
            clearInterval(scrambleInterval);
            // Gradually restore the title, one character at a time
            let revealFrame = 0;
            let waitFrame = 0;
            let revealed = Array(original.length).fill('');
            let revealInterval = setInterval(() => {
                for (let i = 0; i <= revealFrame && i < original.length; i++) {
                    revealed[i] = original[i];
                }
                // Scramble unrevealed chars
                for (let i = revealFrame + 1; i < original.length; i++) {
                    revealed[i] = scrambleText(original[i]);
                }
                titleElem.textContent = revealed.join('');
                waitFrame++;
                if (waitFrame >= 10) {
                    revealFrame++;
                    waitFrame = 0;
                }
                if (revealFrame >= original.length) {
                    clearInterval(revealInterval);
                    titleElem.textContent = original;
                }
            }, 20);
        }
    }, 20);
}

function playSound(id, pitch = 1.0) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.preservesPitch = false;
        sound.currentTime = 0;
        sound.playbackRate = pitch;
        sound.play();
    }
}

let spinCount = 0;

function rollAll() {
    isSpinning = true;
    spinCount++; // Increment spin count
    const reelsList = document.querySelectorAll('.slots > .reel');
    const titleElem = document.getElementById('titleContent');
    const originalTitle = titleElem.textContent;

    animateTitleScramble(originalTitle, 500);

    spinStartTime = Date.now();

    spinSound = () => {
        playSound('blipSound', Math.random() * 0.1 + 1.2 + (Date.now() - spinStartTime)/2000);
        if(isSpinning && Date.now() - spinStartTime < 1500) setTimeout(spinSound, (Date.now() - spinStartTime)/15 + 100);
    };

    spinSound();

    // Rig the result on the third spin
    let riggedResults = null;
    if (spinCount === 3 || Math.random() < 0.1) { // 10% chance to rig
        // Force a win: all reels show the same icon
        const forcedIndex = Math.floor(Math.random() * num_icons);
        riggedResults = [forcedIndex, forcedIndex, forcedIndex];
    }

    // If rigged, resolve rolls with forced values, else use normal roll
    let rollPromises;
    if (riggedResults) {
        rollPromises = [...reelsList].map((reel, i) => 
            new Promise(resolve => {
                // Animate as usual, but always land on forcedIndex
                const offset = i;
                const forcedIndex = riggedResults[i];
                const minSpins = 3 + offset;
                const maxSpins = 6 + offset;
                const spins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
                const targetBackgroundPositionY = (spins * num_icons + forcedIndex) * icon_height;
                const normTargetBackgroundPositionY = (forcedIndex * icon_height) % (num_icons * icon_height);
                const duration = 1200 + Math.random() * 800 + offset * 200;
                reel.style.transition = `background-position-y ${duration}ms cubic-bezier(.45, .05, .58, 1.09)`;
                reel.style.backgroundPositionY = `${targetBackgroundPositionY}px`;
                setTimeout(() => {
                    reel.style.transition = `none`;
                    reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;
                    resolve(forcedIndex);
                }, duration);
            })
        );
    } else {
        rollPromises = [...reelsList].map((reel, i) => roll(reel, i));
    }

    Promise
        .all(rollPromises)
        .then((results) => {
            results.forEach((index, i) => indexes[i] = index);
            const iconNames = results.map(index => icon_map[index]);
            console.log(`Rolled: [${results.join(', ')}] -> [${iconNames.join(', ')}]`);

            if(results[0] === results[1] && results[1] === results[2]) {
                document.querySelector(".slots").classList.add("win");
                setTimeout(() => document.querySelector(".slots").classList.remove("win"), 1500);
                playSound('ultraWinSound', Math.random() * 0.5 + 1.5);
            }
            else{
                document.querySelector(".slots").classList.add("finish");
                setTimeout(() => document.querySelector(".slots").classList.remove("finish"), 1000);
                playSound('winSound', Math.random() * 0.2 + 1.1);
            }
        })
        .finally(() => {
            isSpinning = false;
            finalizeCode();
        });
}

function finalizeCode() {
    const rolled = indexes.slice();
    const allSame = rolled.every(i => i === rolled[0]);
    let obfuscated = code;

    if (allSame) {
        // Special effect for three of a kind
        obfuscated = iconObfuscators[rolled[0]](code, true);
    } else {
        // Apply all three effects in order
        obfuscated = rolled.reduce((acc, iconIdx) => iconObfuscators[iconIdx](acc, false), code);
    }
    window.codeMirrorEditor.setValue(obfuscated);
}

function genSafeVarName(length) {
    const safeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let name = '';
    // do {
    //     name = '';
    //     for (let i = 0; i < length; i++) {
    //         name += safeChars.charAt(Math.floor(Math.random() * safeChars.length));
    //     }
    // } while (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name));
    for (let i = 0; i < length; i++) {
        name += safeChars.charAt(Math.floor(Math.random() * safeChars.length))
    }
    return name;
}

// --- Obfuscation Effects ---

// Renames all variables with random characters
function obfuscateBanana(code, special) {
    // variable renaming
    // \b([a-zA-Z_][a-zA-Z0-9_]*)\s*= matches variables declarations
    // def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\) gets function parameters
    // for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in gets variables used in for loops
    const vars = new Set();
    let match;
    const assignRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
    while (match = assignRegex.exec(code)) vars.add(match[1]);

    const funcParamRegex = /def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\)/g;
    while (match = funcParamRegex.exec(code)) {
        const paramsString = match[1];
        const paramsArray = paramsString.split(',');
        for (let i = 0; i < paramsArray.length; i++) {
            const param = paramsArray[i].trim();
            if (param) {
                vars.add(param);
            }
        }
    }

    const loopVarRegex = /for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in/g;
    while (match = loopVarRegex.exec(code)) vars.add(match[1]);

    console.log(vars)

    const renameMap = {};
    vars.forEach(v => {
        renameMap[v] = genSafeVarName(special ? 16 : v.length);
    });

    let newCode = code;
    Object.keys(renameMap).forEach(orig => {
        const pattern = new RegExp('\\b' + orig + '\\b', 'g');
        newCode = newCode.replace(pattern, renameMap[orig]);
    });

    return newCode;
}

// add random imports that aren't needed

function obfuscateSeven(code, special) {
    return code;
}

function obfuscateCherry(code, special) {
    return code;
}

function obfuscatePlum(code, special) {
    return code;
}

function obfuscateOrange(code, special) {
    return code;
}

function obfuscateBell(code, special) {
    return code;
}

function obfuscateBar(code, special) {
    return code;
}

function obfuscateLemon(code, special) {
    return code;
}

function obfuscateMelon(code, special) {
    return code;
}


const iconObfuscators = [
  obfuscateBanana,
  obfuscateSeven,
  obfuscateCherry,
  obfuscatePlum,
  obfuscateOrange,
  obfuscateBell,
  obfuscateBar,
  obfuscateLemon,
  obfuscateMelon
];



function beginGambleCode() {
    const tokenCount = document.getElementById('tokenCount').textContent;
    code = window.codeMirrorEditor.getValue();

    setInterval(() => isSpinning ? window.codeMirrorEditor.setValue(scrambleText(code)) : null, 100);
}