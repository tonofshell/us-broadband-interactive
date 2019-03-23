//Javascript document

//Functions
let getHeight = function (parentId) {
    let hei = document.getElementById(parentId).offsetHeight;
//	console.log("Current height: " + hei);
    return hei;
};

let getWidth = function (parentId) {
    let wid = document.getElementById(parentId).offsetWidth;
//	console.log("Current width: " + wid);
    return wid;
};

let zoomIn = function (factor) {
    zoomLevel = zoomLevel + factor;
    console.log("zoomLevel: " + zoomLevel);
    mapSvg.select("#svg-map").selectAll('path').transition(transInterval).call(zoom.scaleBy, factor);
};

let zoomOut = function (factor) {
    zoomLevel = zoomLevel - factor;
    console.log("zoomLevel: " + zoomLevel);
    mapSvg.select("#svg-map").selectAll('path').transition(transInterval).call(zoom.scaleBy, -factor);
};

let zoomReset = function () {
    zoomLevel = 1;
    updateView();
};

let mapPath = function (h, w) {
    let hScale = h / 1100 * 1900 * zoomLevel;
    let wScale = w / 875 * 1200 * zoomLevel;
    let centerH = h / 2;
    let centerW = w / 2;

    console.log(centerW + " " + centerH);
    console.log("scale(" + wScale + ", " + hScale + ")");
    console.log("zoom(" + zoom + ")");

    let finScale = 0;
    if (hScale < wScale) {
        finScale = hScale;
    } else {
        finScale = wScale
    }

    console.log("Map scale: " + finScale);
    let mapProj = d3.geoAlbersUsa().scale([finScale]).translate([centerW, centerH]);
    return d3.geoPath().projection(mapProj);
};

let updateMapSize = function (h, w) {
    console.log("dimensions(" + h + ", " + w + ", " + zoomLevel + ")");
    mapSvg.select("zoom-rect")
        .call(zoom.translateExtent([[0, 0], [w, h]]));

    mapSvg.select("#svg-map").selectAll('path')
    /*		.transition(transInterval / 10)
            .delay(function(d, i) { return i * 0.3; })
            .ease(d3.easeElasticInOut)*/
        .attr("height", h)
        .attr("width", w)
        .attr('d', mapPath(h, w));


};

let updateLegendSize = function (h, w) {
    if (legendWidth > getWidth("container") * alphaLegPos / 2) {
        colorLegPos = 0.25;
        alphaLegPos = (1 - colorLegPos);
        legendWidth = getWidth("container") * alphaLegPos / 2.2
    } else {
        colorLegPos = 0.28;
        alphaLegPos = (1 - colorLegPos);
        legendWidth = 300;
    }
    legendSvg.transition(transInterval / 10)
        .attr("height", h)
        .attr("width", w)
        .select("#color-legend")
        .attr("transform", "translate(" + ((w * colorLegPos) - (legendWidth / 2)) + ", " + 0 + ")");
    legendSvg.transition(transInterval / 10)
        .attr("height", h)
        .attr("width", w)
        .select("#alpha-legend")
        .attr("transform", "translate(" + ((w * alphaLegPos) - (legendWidth / 2)) + ", " + 0 + ")");
};

let updateView = function () {
    updateMapSize(getHeight("map-wrap"), getWidth("map-wrap"));
    updateLegendSize(getHeight("legend-wrap"), getWidth("legend-wrap"));
};

let changeVars = function () {
    let cSelector = document.getElementById("colorSelect");
    let cValue = cSelector[cSelector.selectedIndex].value;
    let aSelector = document.getElementById("alphaSelect");
    let aValue = aSelector[aSelector.selectedIndex].value;
    console.log(cValue + " " + aValue);
    cTrans = [];
    if (document.getElementById("cPercent").checked) {
        cTrans.push("percent")
    }
    if (document.getElementById("cDummy").checked) {
        cTrans.push("dummy")
    }
    if (document.getElementById("cReverse").checked) {
        cTrans.push("reverse")
    }

    aTrans = [];
    if (document.getElementById("aPercent").checked) {
        aTrans.push("percent")
    }
    if (document.getElementById("aDummy").checked) {
        aTrans.push("dummy")
    }
    if (document.getElementById("aReverse").checked) {
        aTrans.push("reverse")
    }

    changeMapVars(cValue, aValue, cTrans, aTrans);
};

let updateLegend = function (data, variable, parent, colorScale, svg, parentDiv, varMin, varMax) {
    let legendH = getHeight(parentDiv);
    let legendW = legendWidth;

    let x = d3.scaleLinear()
        .domain([varMin, varMax])
        .rangeRound([0, legendW]);

    let y = d3.scaleLinear()
        .range([legendH, 55]);
// used https://bl.ocks.org/d3noob/96b74d0bd6d11427dd797892551a103c as reference for histogram
// set the parameters for the histogram
    let hist = d3.histogram()
        .value(function (dSub) {
            return dSub.properties[variable]
        })
        .domain(x.domain())
        .thresholds(x.ticks());

    let bins = hist(data.features);
    console.log(bins);

    // Scale the range of the data in the y domain
    y.domain([0, d3.max(bins, function (dSub) {
        /*			console.log(dSub.length);*/
        return dSub.length;
    })]);

    let legend = svg.select(parent).selectAll("#bar").data(bins);

// used https://bl.ocks.org/mbostock/3808234 as reference for update cycle
    legend.exit()
        .attr("class", "exit")
        .transition()
        .duration(transInterval)
        .delay(function (d, i) {
            return i * 10;
        })
        .style("fill-opacity", 1e-6)
        .remove();

    legend.attr("class", "update")
        .attr("x", 1)
        .style("fill-opacity", 1)
        .transition()
        .duration(transInterval)
        .attr("transform", function (dBins) {
            return "translate(" + x(dBins.x0) + "," + (y(dBins.length) - 30) + ")";
        })
        .attr("width", function (dBins) {
            return x(dBins.x1) - x(dBins.x0);
        })
        .attr("height", function (dBins) {
            /*				console.log(legendH - colorY(dBins.length));*/
            return legendH - y(dBins.length) + 10;
        })
        .attr("fill", function (dBins) {
            //console.log(dBins.x1);
            return colorScale(dBins.x1);
        });

    legend.enter()
        .append("rect")
        .transition()
        .duration(transInterval)
        .delay(function (d, i) {
            return i * 10;
        })
        .attr("class", "enter")
        .attr("id", "bar")
        .attr("x", 1)
        .attr("transform", function (dBins) {
            return "translate(" + x(dBins.x0) + "," + (y(dBins.length) - 30) + ")";
        })
        .attr("width", function (dBins) {
            return x(dBins.x1) - x(dBins.x0);
        })
        .attr("height", function (dBins) {
            /*				console.log(legendH - colorY(dBins.length));*/
            return legendH - y(dBins.length) + 10;
        })
        .attr("fill", function (dBins) {
            //console.log(dBins.x1);
            return colorScale(dBins.x1);
        });

    // add the x Axis
    svg.select(parent)
        .select("g")
        .transition()
        .duration(transInterval)
        .attr("transform", "translate(0," + (legendH - 20) + ")")
        .call(d3.axisBottom(x));

    /*mapSvg.select("#color-legend")
        .call(colorLegend);*/

// Add legend title
    svg.select(parent).select("#title")
        .transition()
        .duration(transInterval)
        .text(varNames[0][variable]);
};

let changeMapVars = function (colorVar, alphaVar, colorTransf, alphaTransf) {
    cVar = colorVar;
    aVar = alphaVar;
    dataPromise.then(function (d) {
        let dColorMin = d3.min(d.features, function (dSub) {
            return dSub.properties[colorVar]
        });
        let dColorMax = d3.max(d.features, function (dSub) {
            return dSub.properties[colorVar]
        });

        let dAlphaMin = d3.min(d.features, function (dSub) {
            return dSub.properties[alphaVar]
        });
        let dAlphaMax = d3.max(d.features, function (dSub) {
            return dSub.properties[alphaVar]
        });

        console.log(colorVar + ": range(" + dColorMin + ", " + dColorMax + ")");

        // define some scale variables

        let colorDomain = [dColorMin, dColorMax];
        let colorRange = ["rgb(235, 80, 40)", "rgb(255, 120, 55)", "rgb(255, 215, 70)", "rgb(30, 210, 215)", "rgb(15, 160, 245)"];

        if (colorTransf.includes("percent")) {
            colorDomain = [0, 1];
        }
        if (colorTransf.includes("dummy")) {
            colorRange = ["rgb(235, 80, 40)", "rgb(15, 160, 245)"];
        }
        if (colorTransf.includes("reverse")) {
            colorRange = colorRange.reverse()
        }

        let newColorScale = d3.scaleQuantize().domain(colorDomain).range(colorRange).unknown("#fff");

        let intToGrey = function (int) {
            return "rgb(" + int + "," + int + "," + int + ")";
        };

        let alphaMinVal = 0.1;
        let alphaLegMinVal = 255 - (alphaMinVal * 255);
        let alphaDomain = [dAlphaMin, dAlphaMax];
        let alphaRange = [alphaMinVal, (1 - alphaMinVal) / 3 + alphaMinVal, 2 * (1 - alphaMinVal) / 3 + alphaMinVal, 1];
        console.log(alphaRange);
        let alphaLegendRange = [intToGrey(alphaLegMinVal), intToGrey((0 - alphaLegMinVal) / 3 + alphaLegMinVal), intToGrey(2 * (0 - alphaLegMinVal) / 3 + alphaLegMinVal), intToGrey(0)];
        console.log(alphaLegendRange);

        if (alphaTransf.includes("percent")) {
            alphaDomain = [0, 1];
        }
        if (alphaTransf.includes("dummy")) {
            console.log("dummy")
            alphaRange = [alphaMinVal, 1];
            alphaLegendRange = [intToGrey(alphaLegMinVal), intToGrey(0)];
        }
        if (alphaTransf.includes("reverse")) {
            alphaRange = alphaRange.reverse()
            alphaLegendRange = alphaLegendRange.reverse()
        }

        let newAlphaScale = d3.scaleQuantize().domain(alphaDomain).range(alphaRange).unknown(0);
        let alphaLegendScale = d3.scaleQuantize().domain(alphaDomain).range(alphaLegendRange).unknown(0);


        /*console.log(newColorScale.thresholds())*/
//		console.log(newColorScale(dColorMin) + " " + newColorScale(dColorMed) + " " + newColorScale(dColorMax));
        /*console.log(newAlphaScale(dAlphaMin) + " " + newAlphaScale(dAlphaMax));*/

        // show data on chloropleth
        mapSvg.select("#svg-map").selectAll('path')
            .transition()
            .delay(transInterval)
            .duration(transInterval)
            .ease(d3.easeCircleIn)
            .style('fill', function (dSub) {
                let colorVal = dSub.properties[colorVar];
                let alphaVal = dSub.properties[alphaVar];

                if (colorVar === "NA" || alphaVal === "NA") {
                    return "rgba(240, 240 , 240, 1)";
                }

                let color = newColorScale(colorVal);
                let alpha = newAlphaScale(alphaVal);

                let trimmedStr = "rgba" + color.substring(3);
                return trimmedStr.substring(0, trimmedStr.length - 1) + ", " + alpha + ")";
            });

        let colorLabels = newColorScale.thresholds();
        colorLabels.push(dColorMax);
        colorLabels = colorLabels.map(function (each_element) {
            return Number(each_element.toFixed(2));
        });
        /*		console.log(colorLabels);*/

        let alphaLabels = newAlphaScale.thresholds();
        alphaLabels.push(dAlphaMax);
        alphaLabels = alphaLabels.map(function (each_element) {
            return Number(each_element.toFixed(2));
        });
        /*		console.log(alphaLabels);*/

        updateLegend(d, colorVar, "#color-legend", newColorScale, legendSvg, "legend-wrap", dColorMin, dColorMax);

        updateLegend(d, alphaVar, "#alpha-legend", alphaLegendScale, legendSvg, "legend-wrap", dAlphaMin, dAlphaMax);

    });
};

let zoomed = function () {
    mapSvg.select("#svg-map").attr("transform", d3.event.transform);
};

let initBlankMap = function (dataProm) {
    dataProm.then(function (geoData) {
        //Check that data loaded
        if (geoData == null) {
            console.log("Error loading data");
        } else {
            console.log("Data loaded");
            console.log(geoData);

            mapSvg.append("g")
                .attr("id", "svg-map")
                .call(zoom.translateExtent([[0, 0], [getWidth("map-wrap"), getHeight("map-wrap")]]));

            mapSvg.select("#svg-map").selectAll('path')
                .data(geoData.features)
                .enter()
                .append('path')
                .attr('d', mapPath(getHeight("map-wrap"), getWidth("map-wrap")))
                .attr("GEOID", function (dSub) {
                    return dSub.properties["GEOID"]
                })
                .style('fill', "#5A5A5A")
                .on("mouseover", function (dSub) {
                    d3.select(this)
                        .transition()
                        .style("stroke", "white")
                        .style("stroke-width", "3");
                    //from https://bl.ocks.org/saifulazfar/f2da589a3abbe639fee0996198ace301
                    let xPosition = (d3.mouse(this)[0] - 100);
                    let yPosition = (d3.mouse(this)[1] + 20);
                    console.log("mouseover" + " " + xPosition + " " + yPosition);
                    d3.select("#map-tooltip").html(dSub.properties["subregion"] + "<br>" + dSub.properties[cVar] + "<br>" + dSub.properties[aVar])
                        .transition()
                        .style("opacity", .9)
                        .style("left", xPosition + "px")
                        .style("top", yPosition + "px");
                })
                .on("mouseout", function (dSub) {
                    d3.select("#map-tooltip").transition()
                        .duration(500)
                        .style("opacity", 0);
                    d3.select(this)
                        .transition()
                        .style("stroke", "white")
                        .style("stroke-width", "0")
                });


            // append g elements for future legends
            legendSvg.append("g")
                .attr("id", "color-legend")
                .attr("transform", "translate(" + ((getWidth("legend-wrap") * colorLegPos) - (legendWidth / 2)) + ", " + (0) + ")");
            legendSvg.append("g")
                .attr("id", "alpha-legend")
                .attr("transform", "translate(" + ((getWidth("legend-wrap") * alphaLegPos) - (legendWidth / 2)) + ", " + (0) + ")");

            legendSvg.select("#color-legend").append("g");
            legendSvg.select("#alpha-legend").append("g");

            legendSvg.select("#color-legend").append("text")
                .attr("id", "title")
                .attr("x", 5)
                .attr("y", 20);
            legendSvg.select("#alpha-legend").append("text")
                .attr("id", "title")
                .attr("x", 5)
                .attr("y", 20)
        }
    });
};

//Scripted code

// Global Constants
const transInterval = 500;

// Global Variables
let zoomLevel = 1;
let colorLegPos = 0.28;
let alphaLegPos = (1 - colorLegPos);
let legendWidth = 300;
let cVar = "GEOID";
let aVar = "GEOID";

if (legendWidth > getWidth("container") * alphaLegPos / 2) {
    colorLegPos = 0.25;
    alphaLegPos = (1 - colorLegPos);
    legendWidth = getWidth("container") * alphaLegPos / 2.2
} else {
    colorLegPos = 0.28;
    alphaLegPos = (1 - colorLegPos);
    legendWidth = 300;
}

let tooltipDiv = d3.select("#map-wrap").append("div")
    .attr("class", "tooltip")
    .attr("id", "map-tooltip")
    .style("opacity", 0);

// from Murray, Scott. Interactive Data Visualization for the Web: An Introduction to Designing with D3 (pp. 300-301). O'Reilly Media. Kindle Edition. 
let zoom = d3.zoom()
    .scaleExtent([1.0, 5.0])
    .translateExtent([[0, 0], [getWidth("map-wrap"), getHeight("map-wrap")]])
    .on("zoom", zoomed);

let varNames = [];

d3.json("var_names.json").then(function (names) {
    varNames = names;
});

let mapSvg = d3.select('#map-wrap')
    .append("svg")
    .attr("height", getHeight("map-wrap"))
    .attr("width", getWidth("map-wrap"));

let legendSvg = d3.select('#legend-wrap')
    .append("svg")
    .attr("height", getHeight("legend-wrap"))
    .attr("width", getWidth("legend-wrap"));

//Get the party started
//Promise some data
let dataPromise = d3.json("acs_geo_data_simp.geojson");

init = false;
initBlankMap(dataPromise);

// Link the data to the visualiation
// and draw initial elements on SVG


d3.graphScroll()
    .graph(d3.select('#graph'))
    .container(d3.select('#story-container'))
    .sections(d3.selectAll('#story-content > div'))
    .on('active', function (i) {
        console.log(i + 'th section active');
        if (i === 0) {
            if (init === false) {
                console.log("Initialized Scrollytelling");
                init = true;
            }
        }
        if (i === 1) {
            zoomReset();
            changeMapVars("no_inet", "below_poverty", [], []);
        }
        if (i === 2) {
            zoomReset();
            changeMapVars("broadband_any", "below_poverty", [], []);
        }
        if (i === 3) {
            zoomReset();
            changeMapVars("no_inet", "employed", [], []);
        }
        if (i === 4) {
            zoomReset();
            changeMapVars("no_inet", "white", [], ["reverse"]);
        }
        if (i === 5) {
            zoomReset();
            changeMapVars("broadband_any", "native_amer", [], ["dummy"]);
        }
        if (i === 6) {
            zoomReset();
            changeMapVars("smartphone_alone", "med_income", [], []);
        }
        if (i === 7) {
            zoomReset();
            changeMapVars("no_inet", "month_housing_costs", [], []);
        }
        if (i === 8) {
            zoomReset();
            changeMapVars("desktop_alone", "med_age", [], []);
        }
        if (i === 9) {
            zoomReset();
            // select initial variables to show
            document.getElementById("colorSelect").value = "no_inet";
            document.getElementById("alphaSelect").value = "below_poverty";
            changeVars();
        }
    });
