interface IRotation {
    rotationX: boolean;
    rotationY: boolean;
}

interface IMapSettings {
    currentProjection: TypeOfProjection;
    rotation: IRotation; 
}

enum TypeOfProjection {
    ALBERS_I = "Albers",
    AZIMUTHAL_I = "Azimuthal I",
    AZIMUTHAL_II = "Azimuthal II",
    CONIC_I = "Conic I",
    CONIC_II = "Conic II",
    CONIC_III = "Conic III",
    RECTANGULAR = "Rectangular",
    GNOMONIC = "Gnomonic",
    MERCATOR_I = "Mercator I",
    MERCATOR_II = "Mercator II",
    NATURAL_EARTH = "Natural Earth",
    ORTOGRAPHIC = "Orthographic",
    STEREOGRAPHIC = "Stereographic"
}

export {IMapSettings, TypeOfProjection};