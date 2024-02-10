import * as d3 from 'd3';
import { DragBehavior, ValueFn, ZoomBehavior } from 'd3';
import * as topojson from 'topojson-client';
import './styles/index.css';
import {Topology, Objects} from 'topojson-specification';
import { FeatureCollection, GeoJsonProperties, Geometry, Feature, } from 'geojson';


enum TypeOfD3Map {
    ORTHOGRAPHIC = 'ortographic',
    D2 = 'd2'
}

enum ZoomLevel {
    // Only show continents
    ONE,
    // Show countries & states
    TWO,
    // Show countries & states & their capitals
    THREE,

}

type ZoomType = {
    level: ZoomLevel;
}


var data: Topology<Objects<GeoJsonProperties>>;
var data_oceans: Topology<Objects<GeoJsonProperties>>;
var manager:MapManager;

class MapManager {
    private static currentLoadedMap: D3Map | null = null;
    private zoomLevel: number = 1;
    constructor(mapFactory: new () => D3Map = D3MapD2) {
       if(MapManager.currentLoadedMap === null) MapManager.currentLoadedMap = new mapFactory();
    }

    newD3MapInstance(mapFactory: new () => D3Map) {
        // Destroy current map instance;
        d3.selectAll("svg").remove();
        // Create new map instance;
        MapManager.currentLoadedMap = new mapFactory();
    }

    getZoomLevel() {return this.zoomLevel};
    setZoomLevel(zoomLevel: number) {
        this.zoomLevel = zoomLevel
    };

}

function sharedZoomingDecorator(value: any, name: string, descriptor: PropertyDescriptor) {
    const oldDescriptor = descriptor.value;
    descriptor.value = async function(...args: any[]) {
        const result = await oldDescriptor.apply(this, args);

        // Adjust stroke-width based on scale and set the zoom level inside map manager
        const k = args[0].transform.k;
        manager.setZoomLevel(k);
        d3.selectAll(".boundary")
        .style("stroke-width", .5 / k)

        return result;
    }   

    return descriptor;
}

abstract class D3Map {
    protected svg:d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    protected g:d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    protected projection!: d3.GeoProjection;
    protected path!: d3.GeoPath<any, d3.GeoPermissibleObjects>;
    protected static width: Readonly<number> = 900;
    protected static height: Readonly<number> = 500;
    protected axis!:{x: boolean, y: boolean};

    constructor() {
        this.svg = d3.select("#map-container")
                        .append("svg")
                        .attr("viewBox", [0, 0, D3Map.width, D3Map.height])
                        .attr("width", D3Map.width)
                        .attr("height", D3Map.height)
        this.g = this.svg.append("g");

    }

    // Set-up methods
    protected setUp() {


        const setUpG = (classVal: string, data: Feature<Geometry, GeoJsonProperties>[]):void => {
            this.g.append("g")
                .attr("class", classVal)
                .selectAll("boundary")
                .data(data)
                .enter().append("path")
                .attr("name", d => d.properties?.name)
                .attr("id", d => d.id ?? null)
                .attr("d", this.path as any)
                .style("fill", "lightgreen")
        } 

        const countries = (topojson.feature(data, data.objects.countries) as FeatureCollection<Geometry, GeoJsonProperties>)
        .features
        const states = (topojson.feature(data, data.objects.states) as FeatureCollection<Geometry, GeoJsonProperties>)
        .features;

        setUpG("boundary", countries);
        setUpG("boundary state hidden", states);

    }

    // Functionality methods
    protected dragStart(event: any): void {
    }

    protected dragging(event: any): void {
        const rotate = this.projection.rotate();
        const k = 75 / this.projection.scale();
        this.projection.rotate([
            this.axis.x ? rotate[0] + event.dx * k : 0,
            this.axis.y ? rotate[1] - event.dy * k : 0
        ])
        this.svg.selectAll("path")
                    .attr("d", this.path as any)
    };
    protected dragEnd(event: any): void {
        this.g.selectAll("path")
                .attr("class", "");
    }
    @sharedZoomingDecorator
    protected zooming(event: any): void {
        this.g.attr("transform", event.transform);
    };
    @sharedZoomingDecorator
    protected zooming3D(event: any): void {
        this.g.attr("transform", event.transform);
    }

    protected clickedOnObject(event: any):void {
        // Get GeoPath object
        const pathObject = event.target.__data__;

        const center = d3.geoCentroid(pathObject);

        const rotation:[number, number, number] = [
            this.axis.x ? center[0] * - 1 : 0,
            this.axis.y ? center[1] * - 1 : 0,
            0
        ]
        this.projection.rotate(rotation);
        this.svg.selectAll("path")
                    .attr("d", this.path as any);
    }


}

class D3MapOrtographic extends D3Map {

    constructor() {
    super();

    this.projection = d3.geoOrthographic();
    this.path = d3.geoPath(this.projection);
    this.axis = {x: true, y: true};

        this.setUp();

        this.svg.call(
            (d3.drag() as DragBehavior<SVGSVGElement, unknown, unknown>)
                .on("start", (event) => this.dragStart(event))
                .on("drag", (event) =>
                this.dragging(event))
                .on("end", (event) => this.dragEnd(event))
            )
                    
            this.svg.call(
                (d3.zoom() as ZoomBehavior<SVGSVGElement, unknown>)
                    .on("zoom", (event) => this.zooming3D(event))
                    .scaleExtent([1, 20])
                    .translateExtent([[0, 0], [D3Map.width, D3Map.height]])
            )    

        this.svg.on("click", (event) => this.clickedOnObject(event));
    
   }

}

class D3MapD2 extends D3Map {

    constructor() {
        super()

        this.projection = d3.geoNaturalEarth1()
        this.path = d3.geoPath(this.projection);
        this.axis = {x: true, y: false};

                this.setUp();
    
                this.svg.call(
                    (d3.drag() as any)
                        .on("start", (event:any ) => this.dragStart(event))
                        .on("drag", (event:any ) =>
                        this.dragging(event))
                        .on("end", (event:any ) => this.dragEnd(event))
                    )

                    this.svg.call(
                        (d3.zoom() as ZoomBehavior<SVGSVGElement, unknown>)
                            .on("zoom", (event) => this.zooming(event))
                            .scaleExtent([1, 20])
                            .translateExtent([[0, 0], [D3Map.width, D3Map.height]])
                    )

                    this.svg.on("click", (event) => this.clickedOnObject(event));
                

    }

}

class D3MapGeoMercator extends D3Map {
    constructor() {
        super();
    }
}


window.onload = async () => {

    var fileNormal = "countries-110m.json";
    var fileCombined = "combined.json";
    var fileOceans = "ocean-110m.json";

    const countryNames = "world-country-names.csv";

    data = await d3.json(fileCombined)
        .then((data) => data as Topology<Objects<GeoJsonProperties>>)
        .then((data) => data)
        .catch((err) => {throw new Error(`Couldn't load ${fileCombined} data: ${err}`)})
    // data_oceans = await d3.json(fileOceans)
    //     .then((data) => data as Topology<Objects<GeoJsonProperties>>)
    //     .then((data) => data)
    //     .catch(err => {throw new Error(`Couldn't load ${fileOceans} data: ${err}`)}) 

    const select = document.querySelector("select")!;
    select.onchange = (ev) => {
        const value = (ev.target as any).value;
        switch(value) {
            case TypeOfD3Map.ORTHOGRAPHIC: {
                manager.newD3MapInstance(D3MapOrtographic);
                break;
            }
            case TypeOfD3Map.D2: {
                manager.newD3MapInstance(D3MapD2);
                break;
            }
        }
    }
    manager = new MapManager();
}
