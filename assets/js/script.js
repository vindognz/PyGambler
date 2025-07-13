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
      num_icons = 8,
      time_per_icon = 100,
      indexes = [0, 0, 0],
      icon_map = ["banana", "seven", "cherry", "plum", "bell", "bar", "lemon", "melon"];

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
        if(isSpinning && Date.now() - spinStartTime < 3000) setTimeout(spinSound, (Date.now() - spinStartTime)/15 + 100);
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
        .finally(async () => {
            isSpinning = false;
            await finalizeCode();
        });
}

async function finalizeCode() {
  const rolled = indexes.slice();
  const bellIndex = iconObfuscators.findIndex(fn => fn === obfuscateBell);
  const allSame = rolled.every(i => i === rolled[0]);

  let obfuscated = code;

  async function runObfuscator(fn, codeArg, specialFlag) {
    if (fn === obfuscateBell) {
      return await obfuscateBell(codeArg, specialFlag);
    } else {
      return fn(codeArg, specialFlag);
    }
  }

  if (allSame && rolled[0] === bellIndex) {
    // If all are bell, run once with specialFlag true
    obfuscated = await obfuscateBell(code, true);
  } else {
    // Run all non-bell obfuscators in order
    for (const idx of rolled) {
      if (idx !== bellIndex) {
        obfuscated = await runObfuscator(iconObfuscators[idx], obfuscated, false);
      }
    }

    // Run all bell obfuscators last (if multiple, run in order)
    for (const idx of rolled) {
      if (idx === bellIndex) {
        obfuscated = await obfuscateBell(obfuscated, false);
      }
    }
  }

  window.codeMirrorEditor.setValue(obfuscated);
}

// #region Obfusc. Effects

// helper function to generate a random string, that is safe as python variable name
function genSafeVarName(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var varName = "";

    if (length <= 0) return '';

    for (let i = 0; i < length; i++) {
        varName += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return varName;
}

// renames all variables with random characters
function obfuscateBanana(code, special) {
    // \b([a-zA-Z_][a-zA-Z0-9_]*)\s*= matches variables declarations
    // def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(([^)]*)\) gets function parameters
    // for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in gets variables used in for loops
    const vars = new Set();
    let match;
    const assignRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
    while (match = assignRegex.exec(code)) vars.add(match[1]);

    const unsafe = ["suffix", "mode", "delete"];

    unsafe.forEach(item => vars.delete(item));

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

// array of literally every standard python lib
const pythonLibs = ["__future__", "_abc", "_aix_support", "_ast", "_asyncio", "_bisect", "_blake2", "_bz2", "_codecs", "_codecs_cn", "_codecs_hk", "_codecs_iso2022", "_codecs_jp", "_codecs_kr", "_codecs_tw", "_collections", "_collections_abc", "_compat_pickle", "_compression", "_contextvars", "_crypt", "_csv", "_ctypes", "_curses", "_curses_panel", "_datetime", "_dbm", "_decimal", "_elementtree", "_frozen_importlib", "_frozen_importlib_external", "_functools", "_gdbm", "_hashlib", "_heapq", "_imp", "_io", "_json", "_locale", "_lsprof", "_lzma", "_markupbase", "_md5", "_msi", "_multibytecodec", "_multiprocessing", "_opcode", "_operator", "_osx_support", "_overlapped", "_pickle", "_posixshmem", "_posixsubprocess", "_py_abc", "_pydatetime", "_pydecimal", "_pyio", "_pylong", "_queue", "_random", "_scproxy", "_sha1", "_sha2", "_sha3", "_signal", "_sitebuiltins", "_socket", "_sqlite3", "_sre", "_ssl", "_stat", "_statistics", "_string", "_strptime", "_struct", "_symtable", "_thread", "_threading_local", "_tkinter", "_tokenize", "_tracemalloc", "_typing", "_uuid", "_warnings", "_weakref", "_weakrefset", "_winapi", "_zoneinfo", "abc", "aifc", "antigravity", "argparse", "array", "ast", "asyncio", "atexit", "audioop", "base64", "bdb", "binascii", "bisect", "builtins", "bz2", "cProfile", "calendar", "cgi", "cgitb", "chunk", "cmath", "cmd", "code", "codecs", "codeop", "collections", "colorsys", "compileall", "concurrent", "configparser", "contextlib", "contextvars", "copy", "copyreg", "crypt", "csv", "ctypes", "curses", "dataclasses", "datetime", "dbm", "decimal", "difflib", "dis", "doctest", "email", "encodings", "ensurepip", "enum", "errno", "faulthandler", "fcntl", "filecmp", "fileinput", "fnmatch", "fractions", "ftplib", "functools", "gc", "genericpath", "getopt", "getpass", "gettext", "glob", "graphlib", "grp", "gzip", "hashlib", "heapq", "hmac", "html", "http", "idlelib", "imaplib", "imghdr", "importlib", "inspect", "io", "ipaddress", "itertools", "json", "keyword", "lib2to3", "linecache", "locale", "logging", "lzma", "mailbox", "mailcap", "marshal", "math", "mimetypes", "mmap", "modulefinder", "msilib", "msvcrt", "multiprocessing", "netrc", "nis", "nntplib", "nt", "ntpath", "nturl2path", "numbers", "opcode", "operator", "optparse", "os", "ossaudiodev", "pathlib", "pdb", "pickle", "pickletools", "pipes", "pkgutil", "platform", "plistlib", "poplib", "posix", "posixpath", "pprint", "profile", "pstats", "pty", "pwd", "py_compile", "pyclbr", "pydoc", "pydoc_data", "pyexpat", "queue", "quopri", "random", "re", "readline", "reprlib", "resource", "rlcompleter", "runpy", "sched", "secrets", "select", "selectors", "shelve", "shlex", "shutil", "signal", "site", "smtplib", "sndhdr", "socket", "socketserver", "spwd", "sqlite3", "sre_compile", "sre_constants", "sre_parse", "ssl", "stat", "statistics", "string", "stringprep", "struct", "subprocess", "sunau", "symtable", "sys", "sysconfig", "syslog", "tabnanny", "tarfile", "telnetlib", "tempfile", "termios", "textwrap", "this", "threading", "time", "timeit", "tkinter", "token", "tokenize", "tomllib", "trace", "traceback", "tracemalloc", "tty", "turtle", "turtledemo", "types", "typing", "unicodedata", "unittest", "urllib", "uu", "uuid", "venv", "warnings", "wave", "weakref", "webbrowser", "winreg", "winsound", "wsgiref", "xdrlib", "xml", "xmlrpc", "zipapp", "zipfile", "zipimport", "zlib", "zoneinfo"];

// add random imports that aren't needed
function obfuscateSeven(code, special) {
    const possibles = special ? 15 : 5
    const numoflibs = Math.floor(Math.random() * possibles) + 1;
    console.log(numoflibs);

    for (let i = 0; i < numoflibs; i++) {
        const chosenLib = pythonLibs[Math.floor(Math.random() * pythonLibs.length)];
        code = "import " + chosenLib + "\n" + code
    }

    return code;
}

// wrap the entire script in a 'if 1==1' but complicated looking
function obfuscateCherry(code, special) {
    // generates a complicated looking expression that is just 1
    function generateComplicated1() {
        const functions = [
            x => `(${x}/${x})`,
            x => `round((sin(${x})**2 + cos(${x})**2))`,
            x => `round((sqrt(${x}**2)/${x}))`
        ];

        let e = functions[Math.floor(Math.random()*functions.length)](Math.floor(Math.random()*9)+2);
        e = functions[Math.floor(Math.random()*functions.length)](`(${e})`);

        const noise = ['+0', '-0', '*1', '/1', '+(3-3)', '+(9-9)'][Math.floor(Math.random()*6)]

        const randomVar = genSafeVarName(8);

        return [`(${e}${noise})`]
    }
    
    const exp1 = generateComplicated1();
    const exp2 = generateComplicated1();
    const exp3 = generateComplicated1();
    const imports = "from math import sin, cos, sqrt"
    const ifContents = special ? `if ${exp1} == ${exp2} and ${exp2} == ${exp3}` : `if ${exp1} == 1`;

    return `${imports}\n\n${ifContents}:\n${code
        .split('\n')
        .map(line => '    ' + line)
        .join('\n')}`;
}

// encode all strings as base64
// ADD A SPECIAL EFFECT
function obfuscatePlum(code, special) {
    const stringRegex = /"((?:[^"{\\]|\\.|{[^}]*})*?)"/g;

    return code.replace(stringRegex, (match, inner) => {
        if (inner.includes('{') || inner.includes('}')) return match;

        const base64Encoded = btoa(`"${inner}"`);

        return `eval(__import__("base64").b64decode("${base64Encoded}").decode())`;
    });
}

// chat don't bully my prompt writing. it works ok?. thx
let prompt = "You are a senior developer reviewing junior code. Your task is to add short, sarcastic, and funny inline comments to the code. Roast bad or inefficient code like a grumpy dev with too much caffeine. Be direct, snarky, and a little rude, but stay workplace-appropriate. Explain what each part of the code does, but mock it if it’s outdated, verbose, or inefficient. Keep comments in-line, using # for Python (or appropriate syntax). Output only the code with comments added—no extra explanation. Example style: '# this is the most inefficient possible way to add two strings'. Do not 'fix' the code in any way, but stick purely to comments."

// writes a bunch of snarky ai comments all throughout the code
async function obfuscateBell(code, special) {
    async function getAIComments(fullPrompt) {
        const response = await fetch(`https://ai.hackclub.com/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: fullPrompt }]
            }),
        });
        
        if (!response.ok) { throw new Error(`API Error: ${response.status} ${response.statusText}`); }

        const data = await response.json();

        return data.choices?.[0]?.message?.content || 'No response';
    }

    prompt += special ? " You have to comment every line in the script." : " You don't have to comment every line, just sprinkle them around.";
    prompt += " Now, here's the code to comment:\n\n"

    try {
        const raw = await getAIComments(prompt + code);
        const clean = raw.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();

        return clean;
    } catch (err) {
        console.error(err);
        return code; // fallback to original code on error
    }
}

// writes all the existing code to a file then runs that lmao
function obfuscateBar(code, special) {
    function escapePythonTripleQuotedString(str) {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/"""/g, '\\"\\"\\"');
    }

    if (!special) {
        const escapedCode = escapePythonTripleQuotedString(code);
        return `
import tempfile
import subprocess
import sys

code = """${escapedCode}"""
with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
    f.write(code)
    temp_path = f.name

subprocess.run([sys.executable, temp_path])
        `.trim();
    }

    const escapedCode = escapePythonTripleQuotedString(code);
    const middleCode = `
import tempfile
import subprocess
import sys

code = """${escapedCode}"""
with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
    f.write(code)
    temp_path = f.name

subprocess.run([sys.executable, temp_path])
    `.trim();

    const escapedMiddleCode = escapePythonTripleQuotedString(middleCode);

    return `
import tempfile
import subprocess
import sys

middle_code = """${escapedMiddleCode}"""
with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
    f.write(middle_code)
    middle_path = f.name

subprocess.run([sys.executable, middle_path])
    `.trim();
}

// add classes with massive __init__ functions that do nothing
function obfuscateLemon(code, special) {
    const className = special ? genSafeVarName(16) : genSafeVarName(8);
    const numInits = Math.floor(Math.random() * (className.length + 1));

    let inits = "    def __init__(self):\n";
    if (numInits === 0) {
        inits += "       pass"
    }

    for (let i = 0; i < numInits; i++) {
        const length = special ? 8 : 4;
        const initName = genSafeVarName(length);
        const initValue = (Math.random() < 0.5) ? `"${genSafeVarName(length)}"` : Math.floor(1000 + Math.random() * (9 * 10**length));
        const init = `    self.${initName} = ${initValue}`;
        inits += `    ${init}\n`;
    }

    return `class ${className}():\n${inits}\n` + code;
}

// encode all the numbers as hex
function obfuscateMelon(code, special) {
  let result = '';
  let i = 0;

  const numberRegex = /^-?\d+(\.\d+)?/;

  while (i < code.length) {
    // Skip obfuscation if "base64" or "b64" is found at current position
    if (code.startsWith('base64', i)) {
      result += 'base64';
      i += 'base64'.length;
      continue;
    }
    if (code.startsWith('b64', i)) {
      result += 'b64';
      i += 'b64'.length;
      continue;
    }

    // check if its at a chr(0x...) and skip over it
    if (code.startsWith('chr(0x', i)) {
      const end = code.indexOf(')', i);
      if (end !== -1) {
        // copy the thingy without obfuscation and skip
        result += code.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }

    const numberMatch = code.slice(i).match(numberRegex);
    if (numberMatch) {
      const matchStr = numberMatch[0];
      const number = Number(matchStr);
      const isNegative = number < 0;
      const absolute = Math.abs(number);

      let replacement;
      if (Number.isInteger(number)) {
        let hexString = absolute.toString(16);
        if (special && hexString.length < 16) {
          hexString = hexString.padStart(16, '0');
        }
        replacement = (isNegative ? '-' : '') +
          `int(${[...hexString].map(ch => `chr(0x${ch.charCodeAt(0).toString(16)})`).join(' + ')}, 16)`;
      } else {
        let decString = absolute.toString();
        if (special && decString.length < 16) {
          decString += '0'.repeat(16 - decString.length);
        }
        replacement = (isNegative ? '-' : '') +
          `float(${[...decString].map(ch => `chr(0x${ch.charCodeAt(0).toString(16)})`).join(' + ')})`;
      }

      result += replacement;
      i += matchStr.length;
    } else {
      // not a number or chr(0x...), just copy character
      result += code[i];
      i++;
    }
  }

  return result;
}

//#endregion

const iconObfuscators = [
  obfuscateBanana,
  obfuscateSeven,
  obfuscateCherry,
  obfuscatePlum,
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
