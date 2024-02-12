import { Settings } from "./settings";

export default function domSetup() {
    const settingsBtn = document.querySelector("#settings-container > button")!;
    settingsBtn.addEventListener("click", Settings.settingsToggle)
}
