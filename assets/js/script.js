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
    //#region rig here
    //#endregion
    riggedResults = [7, 7, 7]
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
const pythonLibs = ["__future__", "__main__", "_abc", "_aix_support", "_ast", "_asyncio", "_bisect", "_blake2", "_bootsubprocess", "_bz2", "_codecs", "_codecs_cn", "_codecs_hk", "_codecs_iso2022", "_codecs_jp", "_codecs_kr", "_codecs_tw", "_collections", "_collections_abc", "_compat_pickle", "_compression", "_contextvars", "_crypt", "_csv", "_ctypes", "_curses", "_curses_panel", "_datetime", "_dbm", "_decimal", "_elementtree", "_frozen_importlib", "_frozen_importlib_external", "_functools", "_gdbm", "_hashlib", "_heapq", "_imp", "_io", "_json", "_locale", "_lsprof", "_lzma", "_markupbase", "_md5", "_msi", "_multibytecodec", "_multiprocessing", "_opcode", "_operator", "_osx_support", "_overlapped", "_pickle", "_posixshmem", "_posixsubprocess", "_py_abc", "_pydecimal", "_pyio", "_queue", "_random", "_scproxy", "_sha1", "_sha256", "_sha3", "_sha512", "_signal", "_sitebuiltins", "_socket", "_sqlite3", "_sre", "_ssl", "_stat", "_statistics", "_string", "_strptime", "_struct", "_symtable", "_thread", "_threading_local", "_tkinter", "_tokenize", "_tracemalloc", "_typing", "_uuid", "_warnings", "_weakref", "_weakrefset", "_winapi", "_zoneinfo", "abc", "aifc", "antigravity", "argparse", "array", "ast", "asynchat", "asyncio", "asyncio.__main__", "asyncio.base_events", "asyncio.base_futures", "asyncio.base_subprocess", "asyncio.base_tasks", "asyncio.constants", "asyncio.coroutines", "asyncio.events", "asyncio.exceptions", "asyncio.format_helpers", "asyncio.futures", "asyncio.locks", "asyncio.log", "asyncio.mixins", "asyncio.proactor_events", "asyncio.protocols", "asyncio.queues", "asyncio.runners", "asyncio.selector_events", "asyncio.sslproto", "asyncio.staggered", "asyncio.streams", "asyncio.subprocess", "asyncio.taskgroups", "asyncio.tasks", "asyncio.threads", "asyncio.timeouts", "asyncio.transports", "asyncio.trsock", "asyncio.unix_events", "asyncio.windows_events", "asyncio.windows_utils", "asyncore", "atexit", "audioop", "base64", "bdb", "binascii", "bisect", "builtins", "bz2", "cProfile", "calendar", "cgi", "cgitb", "chunk", "cmath", "cmd", "code", "codecs", "codeop", "collections", "collections.abc", "colorsys", "compileall", "concurrent", "concurrent.futures", "concurrent.futures._base", "concurrent.futures.process", "concurrent.futures.thread", "configparser", "contextlib", "contextvars", "copy", "copyreg", "crypt", "csv", "ctypes", "ctypes._aix", "ctypes._endian", "ctypes.macholib", "ctypes.macholib.dyld", "ctypes.macholib.dylib", "ctypes.macholib.framework", "ctypes.test", "ctypes.test.__main__", "ctypes.test.test_anon", "ctypes.test.test_array_in_pointer", "ctypes.test.test_arrays", "ctypes.test.test_as_parameter", "ctypes.test.test_bitfields", "ctypes.test.test_buffers", "ctypes.test.test_bytes", "ctypes.test.test_byteswap", "ctypes.test.test_callbacks", "ctypes.test.test_cast", "ctypes.test.test_cfuncs", "ctypes.test.test_checkretval", "ctypes.test.test_delattr", "ctypes.test.test_errno", "ctypes.test.test_find", "ctypes.test.test_frombuffer", "ctypes.test.test_funcptr", "ctypes.test.test_functions", "ctypes.test.test_incomplete", "ctypes.test.test_init", "ctypes.test.test_internals", "ctypes.test.test_keeprefs", "ctypes.test.test_libc", "ctypes.test.test_loading", "ctypes.test.test_macholib", "ctypes.test.test_memfunctions", "ctypes.test.test_numbers", "ctypes.test.test_objects", "ctypes.test.test_parameters", "ctypes.test.test_pep3118", "ctypes.test.test_pickling", "ctypes.test.test_pointers", "ctypes.test.test_prototypes", "ctypes.test.test_python_api", "ctypes.test.test_random_things", "ctypes.test.test_refcounts", "ctypes.test.test_repr", "ctypes.test.test_returnfuncptrs", "ctypes.test.test_simplesubclasses", "ctypes.test.test_sizes", "ctypes.test.test_slicing", "ctypes.test.test_stringptr", "ctypes.test.test_strings", "ctypes.test.test_struct_fields", "ctypes.test.test_structures", "ctypes.test.test_unaligned_structures", "ctypes.test.test_unicode", "ctypes.test.test_values", "ctypes.test.test_varsize_struct", "ctypes.test.test_win32", "ctypes.test.test_wintypes", "ctypes.util", "ctypes.wintypes", "curses", "curses.ascii", "curses.has_key", "curses.panel", "curses.textpad", "dataclasses", "datetime", "dbm", "dbm.dumb", "dbm.gnu", "dbm.ndbm", "decimal", "difflib", "dis", "distutils", "distutils._collections", "distutils._functools", "distutils._macos_compat", "distutils._msvccompiler", "distutils.archive_util", "distutils.bcppcompiler", "distutils.ccompiler", "distutils.cmd", "distutils.command", "distutils.command._framework_compat", "distutils.command.bdist", "distutils.command.bdist_dumb", "distutils.command.bdist_rpm", "distutils.command.build", "distutils.command.build_clib", "distutils.command.build_ext", "distutils.command.build_py", "distutils.command.build_scripts", "distutils.command.check", "distutils.command.clean", "distutils.command.config", "distutils.command.install", "distutils.command.install_data", "distutils.command.install_egg_info", "distutils.command.install_headers", "distutils.command.install_lib", "distutils.command.install_scripts", "distutils.command.py37compat", "distutils.command.register", "distutils.command.sdist", "distutils.command.upload", "distutils.config", "distutils.core", "distutils.cygwinccompiler", "distutils.debug", "distutils.dep_util", "distutils.dir_util", "distutils.dist", "distutils.errors", "distutils.extension", "distutils.fancy_getopt", "distutils.file_util", "distutils.filelist", "distutils.log", "distutils.msvc9compiler", "distutils.msvccompiler", "distutils.py38compat", "distutils.py39compat", "distutils.spawn", "distutils.sysconfig", "distutils.text_file", "distutils.unixccompiler", "distutils.util", "distutils.version", "distutils.versionpredicate", "doctest", "email", "email._encoded_words", "email._header_value_parser", "email._parseaddr", "email._policybase", "email.base64mime", "email.charset", "email.contentmanager", "email.encoders", "email.errors", "email.feedparser", "email.generator", "email.header", "email.headerregistry", "email.iterators", "email.message", "email.mime", "email.mime.application", "email.mime.audio", "email.mime.base", "email.mime.image", "email.mime.message", "email.mime.multipart", "email.mime.nonmultipart", "email.mime.text", "email.parser", "email.policy", "email.quoprimime", "email.utils", "encodings", "encodings.aliases", "encodings.ascii", "encodings.base64_codec", "encodings.big5", "encodings.big5hkscs", "encodings.bz2_codec", "encodings.charmap", "encodings.cp037", "encodings.cp1006", "encodings.cp1026", "encodings.cp1125", "encodings.cp1140", "encodings.cp1250", "encodings.cp1251", "encodings.cp1252", "encodings.cp1253", "encodings.cp1254", "encodings.cp1255", "encodings.cp1256", "encodings.cp1257", "encodings.cp1258", "encodings.cp273", "encodings.cp424", "encodings.cp437", "encodings.cp500", "encodings.cp720", "encodings.cp737", "encodings.cp775", "encodings.cp850", "encodings.cp852", "encodings.cp855", "encodings.cp856", "encodings.cp857", "encodings.cp858", "encodings.cp860", "encodings.cp861", "encodings.cp862", "encodings.cp863", "encodings.cp864", "encodings.cp865", "encodings.cp866", "encodings.cp869", "encodings.cp874", "encodings.cp875", "encodings.cp932", "encodings.cp949", "encodings.cp950", "encodings.euc_jis_2004", "encodings.euc_jisx0213", "encodings.euc_jp", "encodings.euc_kr", "encodings.gb18030", "encodings.gb2312", "encodings.gbk", "encodings.hex_codec", "encodings.hp_roman8", "encodings.hz", "encodings.idna", "encodings.iso2022_jp", "encodings.iso2022_jp_1", "encodings.iso2022_jp_2", "encodings.iso2022_jp_2004", "encodings.iso2022_jp_3", "encodings.iso2022_jp_ext", "encodings.iso2022_kr", "encodings.iso8859_1", "encodings.iso8859_10", "encodings.iso8859_11", "encodings.iso8859_13", "encodings.iso8859_14", "encodings.iso8859_15", "encodings.iso8859_16", "encodings.iso8859_2", "encodings.iso8859_3", "encodings.iso8859_4", "encodings.iso8859_5", "encodings.iso8859_6", "encodings.iso8859_7", "encodings.iso8859_8", "encodings.iso8859_9", "encodings.johab", "encodings.koi8_r", "encodings.koi8_t", "encodings.koi8_u", "encodings.kz1048", "encodings.latin_1", "encodings.mac_arabic", "encodings.mac_croatian", "encodings.mac_cyrillic", "encodings.mac_farsi", "encodings.mac_greek", "encodings.mac_iceland", "encodings.mac_latin2", "encodings.mac_roman", "encodings.mac_romanian", "encodings.mac_turkish", "encodings.mbcs", "encodings.oem", "encodings.palmos", "encodings.ptcp154", "encodings.punycode", "encodings.quopri_codec", "encodings.raw_unicode_escape", "encodings.rot_13", "encodings.shift_jis", "encodings.shift_jis_2004", "encodings.shift_jisx0213", "encodings.tis_620", "encodings.undefined", "encodings.unicode_escape", "encodings.utf_16", "encodings.utf_16_be", "encodings.utf_16_le", "encodings.utf_32", "encodings.utf_32_be", "encodings.utf_32_le", "encodings.utf_7", "encodings.utf_8", "encodings.utf_8_sig", "encodings.uu_codec", "encodings.zlib_codec", "ensurepip", "ensurepip.__main__", "ensurepip._uninstall", "enum", "errno", "faulthandler", "fcntl", "filecmp", "fileinput", "fnmatch", "fractions", "ftplib", "functools", "gc", "genericpath", "getopt", "getpass", "gettext", "glob", "graphlib", "grp", "gzip", "hashlib", "heapq", "hmac", "html", "html.entities", "html.parser", "http", "http.client", "http.cookiejar", "http.cookies", "http.server", "idlelib", "idlelib.__main__", "idlelib.autocomplete", "idlelib.autocomplete_w", "idlelib.autoexpand", "idlelib.browser", "idlelib.calltip", "idlelib.calltip_w", "idlelib.codecontext", "idlelib.colorizer", "idlelib.config", "idlelib.config_key", "idlelib.configdialog", "idlelib.debugger", "idlelib.debugger_r", "idlelib.debugobj", "idlelib.debugobj_r", "idlelib.delegator", "idlelib.dynoption", "idlelib.editor", "idlelib.filelist", "idlelib.format", "idlelib.grep", "idlelib.help", "idlelib.help_about", "idlelib.history", "idlelib.hyperparser", "idlelib.idle", "idlelib.idle_test", "idlelib.idle_test.htest", "idlelib.idle_test.mock_idle", "idlelib.idle_test.mock_tk", "idlelib.idle_test.template", "idlelib.idle_test.test_autocomplete", "idlelib.idle_test.test_autocomplete_w", "idlelib.idle_test.test_autoexpand", "idlelib.idle_test.test_browser", "idlelib.idle_test.test_calltip", "idlelib.idle_test.test_calltip_w", "idlelib.idle_test.test_codecontext", "idlelib.idle_test.test_colorizer", "idlelib.idle_test.test_config", "idlelib.idle_test.test_config_key", "idlelib.idle_test.test_configdialog", "idlelib.idle_test.test_debugger", "idlelib.idle_test.test_debugger_r", "idlelib.idle_test.test_debugobj", "idlelib.idle_test.test_debugobj_r", "idlelib.idle_test.test_delegator", "idlelib.idle_test.test_editmenu", "idlelib.idle_test.test_editor", "idlelib.idle_test.test_filelist", "idlelib.idle_test.test_format", "idlelib.idle_test.test_grep", "idlelib.idle_test.test_help", "idlelib.idle_test.test_help_about", "idlelib.idle_test.test_history", "idlelib.idle_test.test_hyperparser", "idlelib.idle_test.test_iomenu", "idlelib.idle_test.test_macosx", "idlelib.idle_test.test_mainmenu", "idlelib.idle_test.test_multicall", "idlelib.idle_test.test_outwin", "idlelib.idle_test.test_parenmatch", "idlelib.idle_test.test_pathbrowser", "idlelib.idle_test.test_percolator", "idlelib.idle_test.test_pyparse", "idlelib.idle_test.test_pyshell", "idlelib.idle_test.test_query", "idlelib.idle_test.test_redirector", "idlelib.idle_test.test_replace", "idlelib.idle_test.test_rpc", "idlelib.idle_test.test_run", "idlelib.idle_test.test_runscript", "idlelib.idle_test.test_scrolledlist", "idlelib.idle_test.test_search", "idlelib.idle_test.test_searchbase", "idlelib.idle_test.test_searchengine", "idlelib.idle_test.test_sidebar", "idlelib.idle_test.test_squeezer", "idlelib.idle_test.test_stackviewer", "idlelib.idle_test.test_statusbar", "idlelib.idle_test.test_text", "idlelib.idle_test.test_textview", "idlelib.idle_test.test_tooltip", "idlelib.idle_test.test_tree", "idlelib.idle_test.test_undo", "idlelib.idle_test.test_util", "idlelib.idle_test.test_warning", "idlelib.idle_test.test_window", "idlelib.idle_test.test_zoomheight", "idlelib.idle_test.test_zzdummy", "idlelib.idle_test.tkinter_testing_utils", "idlelib.iomenu", "idlelib.macosx", "idlelib.mainmenu", "idlelib.multicall", "idlelib.outwin", "idlelib.parenmatch", "idlelib.pathbrowser", "idlelib.percolator", "idlelib.pyparse", "idlelib.pyshell", "idlelib.query", "idlelib.redirector", "idlelib.replace", "idlelib.rpc", "idlelib.run", "idlelib.runscript", "idlelib.scrolledlist", "idlelib.search", "idlelib.searchbase", "idlelib.searchengine", "idlelib.sidebar", "idlelib.squeezer", "idlelib.stackviewer", "idlelib.statusbar", "idlelib.textview", "idlelib.tooltip", "idlelib.tree", "idlelib.undo", "idlelib.util", "idlelib.window", "idlelib.zoomheight", "idlelib.zzdummy", "imaplib", "imghdr", "imp", "importlib", "importlib._abc", "importlib._bootstrap", "importlib._bootstrap_external", "importlib.abc", "importlib.machinery", "importlib.metadata", "importlib.metadata._adapters", "importlib.metadata._collections", "importlib.metadata._functools", "importlib.metadata._itertools", "importlib.metadata._meta", "importlib.metadata._text", "importlib.readers", "importlib.resources", "importlib.resources._adapters", "importlib.resources._common", "importlib.resources._itertools", "importlib.resources._legacy", "importlib.resources.abc", "importlib.resources.readers", "importlib.resources.simple", "importlib.simple", "importlib.util", "inspect", "io", "ipaddress", "itertools", "json", "json.decoder", "json.encoder", "json.scanner", "json.tool", "keyword", "lib2to3", "lib2to3.__main__", "lib2to3.btm_matcher", "lib2to3.btm_utils", "lib2to3.fixer_base", "lib2to3.fixer_util", "lib2to3.fixes", "lib2to3.fixes.fix_apply", "lib2to3.fixes.fix_asserts", "lib2to3.fixes.fix_basestring", "lib2to3.fixes.fix_buffer", "lib2to3.fixes.fix_dict", "lib2to3.fixes.fix_except", "lib2to3.fixes.fix_exec", "lib2to3.fixes.fix_execfile", "lib2to3.fixes.fix_exitfunc", "lib2to3.fixes.fix_filter", "lib2to3.fixes.fix_funcattrs", "lib2to3.fixes.fix_future", "lib2to3.fixes.fix_getcwdu", "lib2to3.fixes.fix_has_key", "lib2to3.fixes.fix_idioms", "lib2to3.fixes.fix_import", "lib2to3.fixes.fix_imports", "lib2to3.fixes.fix_imports2", "lib2to3.fixes.fix_input", "lib2to3.fixes.fix_intern", "lib2to3.fixes.fix_isinstance", "lib2to3.fixes.fix_itertools", "lib2to3.fixes.fix_itertools_imports", "lib2to3.fixes.fix_long", "lib2to3.fixes.fix_map", "lib2to3.fixes.fix_metaclass", "lib2to3.fixes.fix_methodattrs", "lib2to3.fixes.fix_ne", "lib2to3.fixes.fix_next", "lib2to3.fixes.fix_nonzero", "lib2to3.fixes.fix_numliterals", "lib2to3.fixes.fix_operator", "lib2to3.fixes.fix_paren", "lib2to3.fixes.fix_print", "lib2to3.fixes.fix_raise", "lib2to3.fixes.fix_raw_input", "lib2to3.fixes.fix_reduce", "lib2to3.fixes.fix_reload", "lib2to3.fixes.fix_renames", "lib2to3.fixes.fix_repr", "lib2to3.fixes.fix_set_literal", "lib2to3.fixes.fix_standarderror", "lib2to3.fixes.fix_sys_exc", "lib2to3.fixes.fix_throw", "lib2to3.fixes.fix_tuple_params", "lib2to3.fixes.fix_types", "lib2to3.fixes.fix_unicode", "lib2to3.fixes.fix_urllib", "lib2to3.fixes.fix_ws_comma", "lib2to3.fixes.fix_xrange", "lib2to3.fixes.fix_xreadlines", "lib2to3.fixes.fix_zip", "lib2to3.main", "lib2to3.patcomp", "lib2to3.pgen2", "lib2to3.pgen2.conv", "lib2to3.pgen2.driver", "lib2to3.pgen2.grammar", "lib2to3.pgen2.literals", "lib2to3.pgen2.parse", "lib2to3.pgen2.pgen", "lib2to3.pgen2.token", "lib2to3.pgen2.tokenize", "lib2to3.pygram", "lib2to3.pytree", "lib2to3.refactor", "lib2to3.tests", "lib2to3.tests.__main__", "lib2to3.tests.pytree_idempotency", "lib2to3.tests.support", "lib2to3.tests.test_all_fixers", "lib2to3.tests.test_fixers", "lib2to3.tests.test_main", "lib2to3.tests.test_parser", "lib2to3.tests.test_pytree", "lib2to3.tests.test_refactor", "lib2to3.tests.test_util", "linecache", "locale", "logging", "logging.config", "logging.handlers", "lzma", "mailbox", "mailcap", "marshal", "math", "mimetypes", "mmap", "modulefinder", "msilib", "msvcrt", "multiprocessing", "multiprocessing.connection", "multiprocessing.context", "multiprocessing.dummy", "multiprocessing.dummy.connection", "multiprocessing.forkserver", "multiprocessing.heap", "multiprocessing.managers", "multiprocessing.pool", "multiprocessing.popen_fork", "multiprocessing.popen_forkserver", "multiprocessing.popen_spawn_posix", "multiprocessing.popen_spawn_win32", "multiprocessing.process", "multiprocessing.queues", "multiprocessing.reduction", "multiprocessing.resource_sharer", "multiprocessing.resource_tracker", "multiprocessing.shared_memory", "multiprocessing.sharedctypes", "multiprocessing.spawn", "multiprocessing.synchronize", "multiprocessing.util", "netrc", "nis", "nntplib", "nt", "ntpath", "nturl2path", "numbers", "opcode", "operator", "optparse", "os", "os.path", "ossaudiodev", "pathlib", "pdb", "pickle", "pickletools", "pipes", "pkgutil", "platform", "plistlib", "poplib", "posix", "posixpath", "pprint", "profile", "pstats", "pty", "pwd", "py_compile", "pyclbr", "pydoc", "pydoc_data", "pydoc_data.topics", "pyexpat", "pyexpat.errors", "pyexpat.model", "queue", "quopri", "random", "re", "re._casefix", "re._compiler", "re._constants", "re._parser", "readline", "reprlib", "resource", "rlcompleter", "runpy", "sched", "secrets", "select", "selectors", "shelve", "shlex", "shutil", "signal", "site", "smtpd", "smtplib", "sndhdr", "socket", "socketserver", "spwd", "sqlite3", "sqlite3.dbapi2", "sqlite3.dump", "sre_compile", "sre_constants", "sre_parse", "ssl", "stat", "statistics", "string", "stringprep", "struct", "subprocess", "sunau", "symtable", "sys", "sysconfig", "syslog", "tabnanny", "tarfile", "telnetlib", "tempfile", "termios", "textwrap", "this", "threading", "time", "timeit", "tkinter", "tkinter.__main__", "tkinter.colorchooser", "tkinter.commondialog", "tkinter.constants", "tkinter.dialog", "tkinter.dnd", "tkinter.filedialog", "tkinter.font", "tkinter.messagebox", "tkinter.scrolledtext", "tkinter.simpledialog", "tkinter.test", "tkinter.test.support", "tkinter.test.test_tkinter", "tkinter.test.test_tkinter.test_colorchooser", "tkinter.test.test_tkinter.test_font", "tkinter.test.test_tkinter.test_geometry_managers", "tkinter.test.test_tkinter.test_images", "tkinter.test.test_tkinter.test_loadtk", "tkinter.test.test_tkinter.test_messagebox", "tkinter.test.test_tkinter.test_misc", "tkinter.test.test_tkinter.test_simpledialog", "tkinter.test.test_tkinter.test_text", "tkinter.test.test_tkinter.test_variables", "tkinter.test.test_tkinter.test_widgets", "tkinter.test.test_ttk", "tkinter.test.test_ttk.test_extensions", "tkinter.test.test_ttk.test_style", "tkinter.test.test_ttk.test_widgets", "tkinter.test.widget_tests", "tkinter.tix", "tkinter.ttk", "token", "tokenize", "tomllib", "tomllib._parser", "tomllib._re", "tomllib._types", "trace", "traceback", "tracemalloc", "tty", "turtle", "turtledemo", "turtledemo.__main__", "turtledemo.bytedesign", "turtledemo.chaos", "turtledemo.clock", "turtledemo.colormixer", "turtledemo.forest", "turtledemo.fractalcurves", "turtledemo.lindenmayer", "turtledemo.minimal_hanoi", "turtledemo.nim", "turtledemo.paint", "turtledemo.peace", "turtledemo.penrose", "turtledemo.planet_and_moon", "turtledemo.rosette", "turtledemo.round_dance", "turtledemo.sorting_animate", "turtledemo.tree", "turtledemo.two_canvases", "turtledemo.yinyang", "types", "typing", "unicodedata", "unittest", "unittest.__main__", "unittest._log", "unittest.async_case", "unittest.case", "unittest.loader", "unittest.main", "unittest.mock", "unittest.result", "unittest.runner", "unittest.signals", "unittest.suite", "unittest.test", "unittest.test.__main__", "unittest.test._test_warnings", "unittest.test.dummy", "unittest.test.support", "unittest.test.test_assertions", "unittest.test.test_async_case", "unittest.test.test_break", "unittest.test.test_case", "unittest.test.test_discovery", "unittest.test.test_functiontestcase", "unittest.test.test_loader", "unittest.test.test_program", "unittest.test.test_result", "unittest.test.test_runner", "unittest.test.test_setups", "unittest.test.test_skipping", "unittest.test.test_suite", "unittest.test.testmock", "unittest.test.testmock.__main__", "unittest.test.testmock.support", "unittest.test.testmock.testasync", "unittest.test.testmock.testcallable", "unittest.test.testmock.testhelpers", "unittest.test.testmock.testmagicmethods", "unittest.test.testmock.testmock", "unittest.test.testmock.testpatch", "unittest.test.testmock.testsealable", "unittest.test.testmock.testsentinel", "unittest.test.testmock.testwith", "unittest.util", "urllib", "urllib.error", "urllib.parse", "urllib.request", "urllib.response", "urllib.robotparser", "uu", "uuid", "venv", "venv.__main__", "warnings", "wave", "weakref", "webbrowser", "winreg", "winsound", "wsgiref", "wsgiref.handlers", "wsgiref.headers", "wsgiref.simple_server", "wsgiref.types", "wsgiref.util", "wsgiref.validate", "xdrlib", "xml", "xml.dom", "xml.dom.NodeFilter", "xml.dom.domreg", "xml.dom.expatbuilder", "xml.dom.minicompat", "xml.dom.minidom", "xml.dom.pulldom", "xml.dom.xmlbuilder", "xml.etree", "xml.etree.ElementInclude", "xml.etree.ElementPath", "xml.etree.ElementTree", "xml.etree.cElementTree", "xml.parsers", "xml.parsers.expat", "xml.sax", "xml.sax._exceptions", "xml.sax.expatreader", "xml.sax.handler", "xml.sax.saxutils", "xml.sax.xmlreader", "xmlrpc", "xmlrpc.client", "xmlrpc.server", "xxsubtype", "zipapp", "zipfile", "zipimport", "zlib", "zoneinfo", "zoneinfo._common", "zoneinfo._tzpath", "zoneinfo._zoneinfo"];

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

// generates a complicated looking expression that is just 1
function generateComplicated1() {
    const functions = [
        x => `(${x}/${x})`,
        x => `round((sin(${x})**2 + cos(${x})**2))`,
        x => `round((sqrt(${x}**2)/${x}))`
    ];

    const v = ['x', 'y', 'z'][Math.floor(Math.random() * 3)];
    const val = Math.floor(Math.random()*9)+2;

    let e = functions[Math.floor(Math.random()*functions.length)](v);
    e = functions[Math.floor(Math.random()*functions.length)](`(${e})`);

    const noise = ['+0', '-0', '*1', '/1', '+(3-3)', '+(9-9)'][Math.floor(Math.random()*6)]

    const randomVar = genSafeVarName(8);

    return [`from math import sin, cos, sqrt\n${v}=${val}\n${randomVar} = (${e}${noise})`, randomVar]
}

// wrap the entire script in a 'if 1==1' but complicated looking
function obfuscateCherry(code, special) {
    // implement a special where it just does 'if a==b and b==c' but they are all just 1
    const complicated1 = generateComplicated1();
    const expression = complicated1[0];
    const randomVar = complicated1[1];

    code = expression + `\n\nif ${randomVar} == 1:\n${code
        // indents the code block by 1 tab (4 spaces)
        .split('\n')
        .map(line => '    ' + line)
        .join('\n')}`

    return code;
}

// encode all strings as base64
function obfuscatePlum(code) {
    const stringRegex = /"((?:[^"{\\]|\\.|{[^}]*})*?)"/g;

    return code.replace(stringRegex, (match, inner) => {
        if (inner.includes('{') || inner.includes('}')) return match;

        const base64Encoded = btoa(`"${inner}"`);

        return `eval(__import__("base64").b64decode("${base64Encoded}").decode())`;
    });
}

function obfuscateOrange(code, special) {
    // add random functions that do a ton of 'complex' stuff but just pass at the end or return a value and have no implementations
    // def solveWorldHunger(), findWhoAsked(), goofy stuff like that
    return code;
}

function obfuscateBell(code, special) {
    // add random docstrings / comments?
    // probably pulled from a list of broad-ish comments that i can just slap around the code
    // "oh theres a blank line here? 50% chance to append a comment in there"
    return code;
}

function obfuscateBar(code, special) {
    // jackpot maybe, might do all of them if i cant think of anything better
    return code;
}

// add classes with massive __init__ functions that do nothing
// just like initialize a bunch of random variables, maybe pulled from a wordlist then do nothing with them
function obfuscateLemon(code, special) {
    const className = special ? genSafeVarName(8) : genSafeVarName(16);
    const numInits = Math.round(Math.random() * className.length)

    let inits = "    def __init__(self):\n";
    if (numInits === 0) {
        inits += "        pass"
        return `class ${className}():\n${inits}\n` + code;
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
    // check if its at a chr(0x...) and skip over it
    if (code.startsWith('chr(0x', i)) {
      const end = code.indexOf(')', i);
      if (end !== -1) {
        // copy the chr(0x...) without obfuscation and skip
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
