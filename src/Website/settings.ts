import { settings } from "./map";

export module Settings {

    export function settingsToggle() {
        document.querySelector("#settings-container")
                    ?.classList.toggle("active");
    }
    export function toggleRotation(event: any) {
        const selector = event.target.id ===  "settings-rotation-x" ?
                                        "rotationX" : "rotationY";
        settings.rotation[selector] = event.target.checked;
    }
}