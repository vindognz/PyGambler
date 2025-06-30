document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('codeInput');
    const output = document.getElementById('codeOutput');
    const gambleButton = document.getElementById('gambleButton');

    gambleButton.addEventListener('click', () => {
        output.value = input.value;
    });
})