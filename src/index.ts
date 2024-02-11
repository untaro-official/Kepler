import * as d3 from 'd3';
import { DragBehavior, ValueFn, ZoomBehavior } from 'd3';
import * as topojson from 'topojson-client';
// import * as d3Tile from 'd3-tile';
import './styles/index.css';
import {Topology, Objects} from 'topojson-specification';
import { FeatureCollection, GeoJsonProperties, Geometry, Feature, } from 'geojson';


enum TypeOfD3Map {
    D2 = "d2",
    ORTOGRAPHIC = "ortographic"
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

type RouteSelected = {index: number,
                        objectID: string,
                            center: [number, number]};


var data: Topology<Objects<GeoJsonProperties>>;
var data_oceans: Topology<Objects<GeoJsonProperties>>;
var manager:MapManager;

const url = (x: any, y: any, z: any) =>
`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}?access_token=pk.eyJ1IjoibWJvc3RvY2siLCJhIjoiY2s5ZWRlbTM4MDE0eDNocWJ2aXR2amNmeiJ9.LEyjnNDr_BrxRmI4UDyJAQ`;

class MapManager {

    private static currentLoadedMap: D3Map | null = null;
    private zoomLevel: number = 1;
    static mapType: TypeOfD3Map;
    static routes: RouteSelected[] = [];

    constructor(mapFactory: new () => D3Map = D3MapD2) {
       if(MapManager.currentLoadedMap === null) MapManager.currentLoadedMap = new mapFactory();
       MapManager.mapType = TypeOfD3Map.D2;
    }

    newD3MapInstance(mapFactory: new () => D3Map, mapType: TypeOfD3Map) {
        // Destroy current map instance;
        d3.selectAll("svg").remove();
        // Create new map instance;
        MapManager.currentLoadedMap = new mapFactory();
        // Assign mapType
        MapManager.mapType = mapType;
    }

    getZoomLevel() {return this.zoomLevel};
    setZoomLevel(zoomLevel: number) {
        this.zoomLevel = zoomLevel
    };

    // Add to routeSelected list
    static appendRoute(objectID: string, center: [number, number]) {
        // Check if list is empty
        const isEmpty = this.routes.length === 0;
        
        // If list is empty then push to index 0 and stop
        // As well append to route element
        if(isEmpty){
            this.routes.push({index: 0, objectID, center});
            D3Map.appendToRoutes(objectID);
            return;
        }

        // Get next index in list
        const nextIndex = 
            this.routes[this.routes.length - 1].index + 1;
        
        // Append next route
        this.routes.push(
            {index: nextIndex, objectID, center}
        )
        

        // Create link between paths
        D3Map.createNewLink();
        // Append to route element
        D3Map.appendToRoutes(objectID);
            
    }

}

function sharedZoomingDecorator(_target: any, _key: string, descriptor: PropertyDescriptor) {
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
    protected static path: d3.GeoPath<any, d3.GeoPermissibleObjects>;
    protected static width: Readonly<number> = 900;
    protected static height: Readonly<number> = 500;

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
                .attr("d", D3Map.path as any)
                .style("fill", "green")
                .selectAll("image");

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
            rotate[0] + event.dx * k,
            MapManager.mapType === TypeOfD3Map.D2 ? 0 : rotate[1] - event.dy * k
        ])
        this.svg.selectAll("path")
                    .attr("d", D3Map.path as any)
    };
    protected dragEnd(event: any): void {
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
        const pathObject:d3.ExtendedFeature = event.target.__data__;

        // Check if GeoPath object exists on the click
        if(!(!!pathObject)) return;

        // Determine if GeoPath object is country or state
        const objectType = pathObject.id ? "country" :
                            pathObject.properties?.name ? "state" :
                                null;
        
        // Extra check for nullness
        if(objectType === null) return;

        // Determine the selector to be used
        const selector:{identificator: string, queryString: string} = 
            objectType === "country" ? {identificator: pathObject.id, queryString: `#${pathObject.id}`}
             : {identificator: pathObject.properties?.name, queryString: `[name="` + pathObject.properties?.name + `"]`};

        // Find the center of a path
        const center = d3.geoCentroid(pathObject);

        // Determine the rotation needed to center a path
        const rotation:[number, number, number] = [
            center[0] * - 1,
            MapManager.mapType === TypeOfD3Map.D2 ? 0 : center[1] * - 1,
            0
        ]
        
        // References to projection, svg and path in order to use them
        // within functions with context
        const projectionRef = this.projection;
        const svgRef = this.svg;
        const pathRef = D3Map.path;
        // Call rotation and animation functions
        d3.transition()
            .duration(1000)
            .tween("rotate",  function() {
                var r = d3.interpolate(projectionRef.rotate(), rotation);
                return function(t) {
                    var easedT = d3.easeCubicOut(t);
                    projectionRef.rotate(r(easedT));
                    svgRef.selectAll("path")
                            .attr("d", pathRef as any);
                }
            })

        // Modify anything related to the path
        this.svg.select(selector.queryString)
            .classed("clicked", true);
        

        MapManager.appendRoute(selector.identificator, center);

    }

    static createNewLink() {
        const secondLastPath = MapManager.routes[MapManager.routes.length - 2];
        const firstLastPath = MapManager.routes[MapManager.routes.length - 1];
        console.log(secondLastPath, firstLastPath);
        d3.select("svg")
            .selectAll("path-link")
            .data([
                {type: "LineString", 
                coordinates: [secondLastPath.center, firstLastPath.center]}
            ])
            .enter()
            .append("path")
                .attr("d", (d) => this.path(d as any))
                .attr("class", "path-link")
                .style("fill", "none")
                .style("stroke", "orange")
                .style("stroke-width", 7)

    }

    static appendToRoutes(objectID: string) {
        const newLi = d3.select("#route-selected-container > ol")
            .append("li")
            .attr("class", "route-selected")
        newLi.append("div")
            .attr("class", "route-selected-color")
        newLi.append("span")
            .attr("class", "route-selected-code")
            .text(objectID);

    }

}

class D3MapOrtographic extends D3Map {

    constructor() {
    super();

    this.projection = d3.geoOrthographic();
    D3Map.path = d3.geoPath(this.projection);

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
        D3Map.path = d3.geoPath(this.projection);

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
            case TypeOfD3Map.ORTOGRAPHIC: {
                manager.newD3MapInstance(D3MapOrtographic, TypeOfD3Map.ORTOGRAPHIC);
                break;
            }
            case TypeOfD3Map.D2: {
                manager.newD3MapInstance(D3MapD2, TypeOfD3Map.D2);
                break;
            }
        }
    }
    manager = new MapManager();
}
