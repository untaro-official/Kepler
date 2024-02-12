export module Settings {
    export function settingsToggle() {
        document.querySelector("#settings-container")
                    ?.classList.toggle("active");
    }
}