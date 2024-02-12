import { Settings } from "./settings";

export default function domSetup() {
    // Settings btn
    const settingsBtn = document.querySelector("#settings-container > button")!;
    settingsBtn.addEventListener("click", Settings.settingsToggle)
    // Select map

    // Zoom type
    const dragX = document.querySelector("#settings-rotation-x")!;
    const dragY = document.querySelector("#settings-rotation-y")!;

    dragX.addEventListener("change", Settings.toggleRotation)
    dragY.addEventListener("change", Settings.toggleRotation)
}
