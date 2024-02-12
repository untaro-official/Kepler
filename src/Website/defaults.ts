import { IMapSettings, TypeOfProjection } from "./typings";

const DefaultMapSettings:IMapSettings = {
    currentProjection: TypeOfProjection['NATURAL_EARTH'],
    rotation: {
        rotationX: true,
        rotationY: false
    }
}

export {DefaultMapSettings};