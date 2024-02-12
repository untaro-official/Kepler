import * as d3 from 'd3';
import { DragBehavior, ValueFn, ZoomBehavior } from 'd3';
import * as topojson from 'topojson-client';
import '../styles/index.css';
import {Topology, Objects} from 'topojson-specification';
import { FeatureCollection, GeoJsonProperties, Geometry, Feature, } from 'geojson';
import {Helper} from './helper';
import domSetup from './dom';

// Projection imports
import {
    geoAlbers,
    geoAzimuthalEqualArea,
    geoAzimuthalEquidistant,
    geoConicConformal,
    geoConicEqualArea,
    geoConicEquidistant,
    geoEquirectangular,
    geoGnomonic,
    geoMercator,
    geoNaturalEarth1,
    geoOrthographic,
    geoStereographic,
    geoTransverseMercator,
} from 'd3-geo';
import { IMapSettings, TypeOfProjection } from './typings';
import { DefaultMapSettings } from './defaults';


const typeOfProjection = 
    new Map<IMapSettings['currentProjection'],  () => d3.GeoProjection>();



export type RouteSelected = {index: number,
                        objectID: string,
                            center: [number, number]};


var data: Topology<Objects<GeoJsonProperties>>;

var settings: IMapSettings = DefaultMapSettings;

class D3Map {
    protected svg!:d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    protected g!:d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    protected projection!: d3.GeoProjection;
    protected path!: d3.GeoPath<any, d3.GeoPermissibleObjects>;
    protected static path: d3.GeoPath<any, d3.GeoPermissibleObjects>;
    protected static width: Readonly<number> = 960;
    protected static height: Readonly<number> = 500;
    private routes: RouteSelected[] = [];

    constructor() {

        this.setUpVariables();
        this.setUpStorage();
        this.setUpEvents();
        
    }

    /* SetUp Methods */
    private setUpVariables = () => {
        this.svg = d3.select("#map-container")
            .append("svg")
            .attr("viewBox", [0, 0, D3Map.width, D3Map.height])
            .attr("width", D3Map.width)
            .attr("height", D3Map.height)
        this.g = this.svg.append("g");
    }
    private setUpStorage = () => {
        // Get options from local storage
        const optionsStorage = window.localStorage.getItem("options");

        // Validate local storage
        const isValidStorage = Helper.checkLocalStorage(optionsStorage);
        // Do different things depending on whether we have valid local storage or not
        if (!isValidStorage) {
            this.buildDefault();
        }else {
            this.buildFromStorage(optionsStorage);
        }
    }
    private setUpEvents = () => {

        const ctx = {
            svg: this.svg,
            g: this.g,
            projection: this.projection,
            path: this.path,
            routes: this.routes,
            settings: settings
        }

        this.svg.call(
            (d3.drag() as DragBehavior<SVGSVGElement, unknown, unknown>)
            .on("drag", (event) => Helper.dragging(event, ctx))
        )

        this.svg.call(
            (d3.zoom() as ZoomBehavior<SVGSVGElement, unknown>)
            .on("zoom", (event) => Helper.zooming(event, ctx.g))
            .scaleExtent([1, 20])
            .translateExtent([[0, 0], [D3Map.width, D3Map.height]])
        )

        this.svg.on("click", (event) =>
                Helper.clicked(event, ctx));
    }
    /* SetUp Methods */

    private buildDefault() {
        this.projection = (typeOfProjection.get(settings.currentProjection) as () => d3.GeoProjection)();
        this.path = d3.geoPath(this.projection);

        const countries = (topojson.feature(data, data.objects.countries) as FeatureCollection<Geometry, GeoJsonProperties>)
        .features
        const states = (topojson.feature(data, data.objects.states) as FeatureCollection<Geometry, GeoJsonProperties>)
        .features;

        this.setUpG("boundary", countries);
        this.setUpG("boundary state hidden", states);
    }
    private setUpG(classVal: string, data: Feature<Geometry, GeoJsonProperties>[]) {
        this.g.append("g")
        .attr("class", classVal)
        .selectAll("boundary")
        .data(data)
        .enter().append("path")
        .attr("name", d => d.properties?.name)
        .attr("id", d => d.id ?? null)
        .attr("d", this.path as any)
        .style("fill", "green")
        .selectAll("image");
    }

    private buildFromStorage(options: any) {}
        changeProjection(projection: () => d3.GeoProjection) {

    }

}


window.onload = async () => {

    // Setup dom
    domSetup();

    data = await d3.json("combined.json")
        .then((data) => data as Topology<Objects<GeoJsonProperties>>)
        .then((data) => data)
        .catch((err) => {throw new Error(`Couldn't load ${"combined.json"} data: ${err}`)})

    
    onStartupBeforeMap();

    const map = new D3Map();

    onStartupAfterMap(map);

}


const onStartupBeforeMap = () => {
    setUpProjectionMap();
}

const onStartupAfterMap = (map: D3Map) => {
    createSelectElement(map);
}

const createSelectElement = (map: D3Map) => {
    const dropdown = d3.select("#settings-dropdown")
    
    for(const [key, _value] of typeOfProjection) {
        const option = dropdown.append("option")
                    .attr("value", key)
                    .text(key)
        if(key === TypeOfProjection.NATURAL_EARTH) {
            option.attr("selected", true);
        }
    }

    dropdown.on("change", (event) => {
        const value:TypeOfProjection = event.target.value;
        map.changeProjection(typeOfProjection.get(value)!);
    })
}

const setUpProjectionMap = () => {
    typeOfProjection.set(TypeOfProjection.ALBERS_I, geoAlbers);
    typeOfProjection.set(TypeOfProjection.AZIMUTHAL_I, geoAzimuthalEqualArea);
    typeOfProjection.set(TypeOfProjection.AZIMUTHAL_II, geoAzimuthalEquidistant);
    typeOfProjection.set(TypeOfProjection.CONIC_I, geoConicConformal);
    typeOfProjection.set(TypeOfProjection.CONIC_II, geoConicEqualArea);
    typeOfProjection.set(TypeOfProjection.CONIC_III, geoConicEquidistant);
    typeOfProjection.set(TypeOfProjection.RECTANGULAR, geoEquirectangular);
    typeOfProjection.set(TypeOfProjection.GNOMONIC, geoGnomonic);
    typeOfProjection.set(TypeOfProjection.MERCATOR_I, geoMercator);
    typeOfProjection.set(TypeOfProjection.MERCATOR_II, geoTransverseMercator);
    typeOfProjection.set(TypeOfProjection.NATURAL_EARTH, geoNaturalEarth1);
    typeOfProjection.set(TypeOfProjection.ORTOGRAPHIC, geoOrthographic);
    typeOfProjection.set(TypeOfProjection.STEREOGRAPHIC, geoStereographic);
}

export {settings};