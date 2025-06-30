document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('codeInput');
    const output = document.getElementById('codeOutput');
    const gambleButton = document.getElementById('gambleButton');

    gambleButton.addEventListener('click', () => {
        output.value = input.value;
        rollAll();
    });
})

const icon_width = 79,
      icon_height = 79,
      num_icons = 9,
      time_per_icon = 100,
      indexes = [0, 0, 0],
      icon_map = ["banana", "seven", "cherry", "plum", "orange", "bell", "bar", "lemon", "melon"];

const roll = (reel, offset=0) => {
    const delta = (2 + offset) * num_icons + Math.round(Math.random() * num_icons);
    const style = getComputedStyle(reel),
            backgroundPositionY = parseFloat(style["background-position-y"]),
            targetBackgroundPositionY = backgroundPositionY + delta * icon_height,
            normTargetBackgroundPositionY = targetBackgroundPositionY % (num_icons * icon_height);

    return new Promise((resolve, reject) => {
        reel.style.transition = `background-position-y ${8 + delta * time_per_icon}ms cubic-bezier(.45, .05, .58, 1.09)`;
        reel.style.backgroundPositionY = `${targetBackgroundPositionY}px`;

        setTimeout(() => {
            reel.style.transition = `none`;
            reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`
            resolve(delta % num_icons)
        }, 8 + delta * time_per_icon);
    });
}

function rollAll() {
    const reelsList = document.querySelectorAll('.slots > .reel');
    Promise
        .all( [... reelsList].map((reel, i) => roll(reel, i)))
        .then((deltas) => {

            deltas.forEach((delta, i) => indexes[i] = (indexes[i] + delta) % num_icons)

            indexes.map((index) => { console.log(icon_map[index]) })

            document.querySelector(".slots").classList.add("win");
		    setTimeout(() => document.querySelector(".slots").classList.remove("win"), 1000)
        })
}

rollAll();