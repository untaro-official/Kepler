import * as d3 from 'd3';
import { RouteSelected } from '.';

module Helper{
    type ICtx = {
        svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
        g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
        projection: d3.GeoProjection;
        path: d3.GeoPath<any, d3.GeoPermissibleObjects>;
        routes: RouteSelected[];
    }

    /* Drag functions */
    export function _dragStart(event: any, ctx: ICtx) {};
    export function dragging(event: any, ctx: ICtx) {
        const rotate = ctx.projection.rotate();
        const k = 75 / ctx.projection.scale();
        ctx.projection.rotate([
            rotate[0] + event.dx * k,
            rotate[1] + event.dy * k
        ])
        ctx.svg.selectAll("path")
                    .attr("d", ctx.path as any)
    };
    export function _dragEnd(event: any) {};

    /* Zoom functions */
    export function _zoomStart(event: any) {};
    export function zooming(event: any, g: ICtx['g']) {
        // Adjust stroke-width based on scale
        const k = event.transform.k;
        d3.selectAll(".boundary")
            .style("stroke-width", .5 / k);
        g.attr("transform", event.transform);
        
    };
    export function _zoomEnd(event: any) {};

    /* Click function */
    export function clicked(event: any, ctx: ICtx) {
        // Get GeoPath object
        const pathObject = event.target.__data__;

        // Check if GeoPath object exists on click
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
            center[1] * - 1,
            0
        ]

        // Call rotation and animation functions
        d3.transition()
            .duration(1000)
            .tween("rotate",  function() {
                var r = d3.interpolate(ctx.projection.rotate(), rotation);
                return function(t) {
                    var easedT = d3.easeCubicOut(t);
                    ctx.projection.rotate(r(easedT));
                    ctx.svg.selectAll("path")
                            .attr("d", ctx.path as any);
                }
            })

        // Modify anything related to the path
        ctx.svg.select(selector.queryString)
            .classed("clicked", true);

        // Append route to routes
        appendRoute(selector.identificator, center, ctx);
    }

    /* Route functions */
    function appendRoute(objectID: string, center: [number, number], ctx: ICtx) {
         // Check if list is empty
         const isEmpty = ctx.routes.length === 0;

        // If list is empty then push to index 0 and stop
        // As well append to route element
        if(isEmpty){
            ctx.routes.push({index: 0, objectID, center});
            appendToRoutes(objectID);
            return;
        }

        // Get next index in list
        const nextIndex = 
            ctx.routes[ctx.routes.length - 1].index + 1;

        // Append next route
        ctx.routes.push(
            {index: nextIndex, objectID, center}
        )

        // Create link between paths
        createNewLink(ctx);
        // Append to route element
        appendToRoutes(objectID);
    }

    function createNewLink(ctx: ICtx) {
        const secondLastPath = ctx.routes[ctx.routes.length - 2];
        const firstLastPath = ctx.routes[ctx.routes.length - 1];

        d3.select("svg")
            .selectAll("path-link")
            .data([
                {type: "LineString", 
                coordinates: [secondLastPath.center, firstLastPath.center]}
            ])
            .enter()
            .append("path")
                .attr("d", (d) => ctx.path(d as any))
                .attr("class", "path-link")
                .style("fill", "none")
                .style("stroke", "orange")
                .style("stroke-width", 7)
    }
    function appendToRoutes(objectID: string) {
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

export default Helper;

