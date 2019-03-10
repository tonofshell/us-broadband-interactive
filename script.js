//Javascript document

//Functions
let getHeight = function(parentId) {
	let hei = document.getElementById(parentId).offsetHeight;
//	console.log("Current height: " + hei);
	return hei;
}

let getWidth = function(parentId) {
	let wid = document.getElementById(parentId).offsetWidth;
//	console.log("Current width: " + wid);
	return wid;
}

let mapPath = function(h, w) {
	let hScale = h / 1100 * 1900;
	let wScale = w / 875 * 1200;
	let centerH = h / 2;
	let centerW = w / 2;
	
	console.log(centerW + " " + centerH)
	
	let finScale = 0;
	if (hScale < wScale) {
		finScale = hScale;
	} else {
		finScale = wScale
	}
	
	console.log("Map scale: " + finScale)
	let mapProj = d3.geoAlbersUsa().scale([finScale]).translate([centerW, centerH]);
	return d3.geoPath().projection(mapProj);
}

let updateMapSize = function(h, w) {
	console.log("dimensions(" + h + ", " + w +")");
	mapSvg.transition(transInterval / 5)
		.attr("height", h)
		.attr("width", w)
		.selectAll("path")
		.attr('d', mapPath(h, w));
}

let updateLegendSize = function(h, w) {
	legendSvg.transition(transInterval / 10)
		.attr("height", h)
		.attr("width", w)
		.select("#color-legend")
		.attr("transform", "translate(" + ((w * colorLegPos) - (legendWidth / 2) )+ ", " + 0 + ")" )
	legendSvg.transition(transInterval / 10)
		.attr("height", h)
		.attr("width", w)
		.select("#alpha-legend")
		.attr("transform", "translate(" + ((w * alphaLegPos) - (legendWidth / 2) ) + ", " + 0 + ")" );
} 

let updateView = function() {
	updateMapSize(getHeight("map-wrap"), getWidth("map-wrap"));
	updateLegendSize(getHeight("legend-wrap"), getWidth("legend-wrap"));
}

let changeVars = function() {
	let cSelector = document.getElementById("colorSelect");
	let cValue = cSelector[cSelector.selectedIndex].value;
	let aSelector = document.getElementById("alphaSelect");
	let aValue = aSelector[aSelector.selectedIndex].value;
	console.log(cValue + " " + aValue);
	changeMapVars(cValue, aValue, false);
}

let updateLegend = function(data, variable, parent, colorScale, svg, parentDiv, varMin, varMax) {
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
			.value(function(dSub) {
				return dSub.properties[variable] })
			.domain(x.domain())
			.thresholds(x.ticks());
		
		let bins = hist(data.features);
		console.log(bins);

		// Scale the range of the data in the y domain
  		y.domain([0, d3.max(bins, function(dSub) { 
/*			console.log(dSub.length);*/
			return dSub.length; })]);
		
		let legend = svg.select(parent).selectAll("#bar").data(bins);
	
// used https://bl.ocks.org/mbostock/3808234 as reference for update cycle
		legend.exit()
      		.attr("class", "exit")
    		.transition()
			.duration(transInterval)
			.delay(function(d, i) { return i * 10; })
      		.style("fill-opacity", 1e-6)
      		.remove();
		
		legend.attr("class", "update")
      		.attr("x", 1)
      		.style("fill-opacity", 1)
    		.transition()
			.duration(transInterval)
      		.attr("transform", function(dBins) {
			  return "translate(" + x(dBins.x0) + "," + (y(dBins.length) - 30) + ")"; })
			.attr("width", function(dBins) { return x(dBins.x1) - x(dBins.x0); })
			.attr("height", function(dBins) { 
/*				console.log(legendH - colorY(dBins.length));*/
				return legendH - y(dBins.length) + 10; })
			.attr("fill", function(dBins) {
					//console.log(dBins.x1);
					return colorScale(dBins.x1);});

		legend.enter()
			.append("rect")
			.transition()
			.duration(transInterval)
			.delay(function(d, i) { return i * 10; })
			.attr("class", "enter")
			.attr("id", "bar")
		  	.attr("x", 1)
			.attr("transform", function(dBins) {
			  return "translate(" + x(dBins.x0) + "," + (y(dBins.length) - 30) + ")"; })
			.attr("width", function(dBins) { return x(dBins.x1) - x(dBins.x0); })
			.attr("height", function(dBins) { 
/*				console.log(legendH - colorY(dBins.length));*/
				return legendH - y(dBins.length) + 10; })
			.attr("fill", function(dBins) {
					//console.log(dBins.x1);
					return colorScale(dBins.x1);});

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
}

let changeMapVars = function(colorVar, alphaVar, scaleDefault) {
	dataPromise.then(function(d){
		let dColorMin = d3.min(d.features, function(dSub) {return dSub.properties[colorVar]});
		let dColorMax = d3.max(d.features, function(dSub) {return dSub.properties[colorVar]});
		
		let dAlphaMin = d3.min(d.features, function(dSub) {return dSub.properties[alphaVar]});
		let dAlphaMax = d3.max(d.features, function(dSub) {return dSub.properties[alphaVar]});
		
		console.log(colorVar + ": range(" + dColorMin + ", " + dColorMax + ")");
		
		// define some scale variables
		let newColorScale = function(){return "rgba(0, 0, 0, 1)"};
		let newAlphaScale = function(){return "1"};
		let alphaLegendScale = function(){return "rgba(0, 0, 0, 1)"};
		
		// actually make the scales
		//scales percentages on scale of 0 - 1 if scaleDefault is true, otherwise percentages are scaled from min to max
		/*if (scaleDefault && dColorMax <= 1 && dColorMax >= 0) {
			newColorScale = d3.scaleLinear().domain([0, 0.5, 1]).range(["#EB5028", "#E6E673", "#0FA0F5"]).unknown("#000");
		} else {
			newColorScale = d3.scaleLinear().domain([dColorMin, dColorMed, dColorMax]).range(["#EB5028", "#E6E673", "#0FA0F5"]).unknown("#000");
		}*/

		if (scaleDefault && dColorMax <= 1 && dColorMax >= 0) {
			newColorScale = d3.scaleQuantize().domain([0, 1]).range(["rgb(235, 80, 40)", "rgb(255, 120, 55)", "rgb(255, 215, 70)", "rgb(30, 210, 215)", "rgb(15, 160, 245)"]).unknown("#fff");
		} else {
			newColorScale = d3.scaleQuantize().domain([dColorMin, dColorMax]).range(["rgb(235, 80, 40)", "rgb(255, 120, 55)", "rgb(255, 215, 70)", "rgb(30, 210, 215)", "rgb(15, 160, 245)"]).unknown("#fff");
		}
		
		if (scaleDefault && dAlphaMax <= 1 && dAlphaMin >= 0) {
			newAlphaScale = d3.scaleQuantize().domain([0, 1]).range([0.2, 0.4, 0.6, 0.8, 1]).unknown(0);
			alphaLegendScale = d3.scaleQuantize().domain([0, 1]).range(["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.6)", "rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 1)"]).unknown(0);
		} else {
			newAlphaScale = d3.scaleQuantize().domain([dAlphaMin, dAlphaMax]).range([0.2, 0.4, 0.6, 0.8, 1]).unknown(0);
			alphaLegendScale = d3.scaleQuantize().domain([dAlphaMin, dAlphaMax]).range(["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.6)", "rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 1)"]).unknown(0);
		}		
		
		/*console.log(newColorScale.thresholds())*/
//		console.log(newColorScale(dColorMin) + " " + newColorScale(dColorMed) + " " + newColorScale(dColorMax));
		/*console.log(newAlphaScale(dAlphaMin) + " " + newAlphaScale(dAlphaMax));*/
		
		// show data on chloropleth
		mapSvg.select("#svg-map").selectAll('path')
				.transition()
				.duration(transInterval)
				.ease(d3.easeCircleIn)
				.style('fill', function(dSub) {
					let colorVal = dSub.properties[colorVar];
					let alphaVal = dSub.properties[alphaVar];

					if (colorVar == "NA" || alphaVal == "NA") {
						return "rgba(240, 240 , 240, 1)";
					}
			
					let color = newColorScale(colorVal);
					let alpha = newAlphaScale(alphaVal);
					
					let trimmedStr = "rgba" + color.substring(3)
					let rebuiltStr = trimmedStr.substring(0, trimmedStr.length - 1) + ", " + alpha + ")"
					return rebuiltStr;
		});
		
		let colorLabels = newColorScale.thresholds();
		colorLabels.push(dColorMax);
		colorLabels = colorLabels.map(function(each_element){
    		return Number(each_element.toFixed(2));
		});
/*		console.log(colorLabels);*/
		
		let alphaLabels = newAlphaScale.thresholds();
		alphaLabels.push(dAlphaMax);
		alphaLabels = alphaLabels.map(function(each_element){
    		return Number(each_element.toFixed(2));
		});
/*		console.log(alphaLabels);*/
		
		updateLegend(d, colorVar, "#color-legend", newColorScale, legendSvg, "legend-wrap", dColorMin, dColorMax);
		
		updateLegend(d, alphaVar, "#alpha-legend", alphaLegendScale, legendSvg, "legend-wrap", dAlphaMin, dAlphaMax);
		
	});
}

//Scripted code

	//Constants
const transInterval = 750;
const legendWidth = 300;
const colorLegPos = 0.28;
const alphaLegPos = (1 - colorLegPos);

const varNames = [{"avg_fam_inc":"Average Family Income","below_poverty":"Percent Below Poverty Line","broadband_any":"Percent with Broadband","broadband_wired":"Percent with Wired Broadband","broadband_wired_only":"Percent with Only Wired Broadband","cell_inet":"Percent with Cellular Internet","cell_inet_only":"Percent with Only Cellular Internet","desktop_alone":"Percent with Only a Desktop","dial_up_only":"Percent with Only Dial Up","employed":"Percent Employed","female":"Percent Female","med_age":"Median Age","med_income":"Median Income","month_housing_costs":"Average Monthly Housing Cost","no_inet":"Percent with No Internet","pop_dens":"Population Density","satelite":"Percent with Satelite Internet","satelite_only":"Percent with Only Satelite Internet","smartphone_alone":"Percent with Only a Smartphone","tablet_alone":"Percent with Only a Tablet","white":"Percent White","work_outside_res_area":"Percent that Works Outside County"}];


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

// Link the data to the visualiation
// and draw initial elements on SVG
dataPromise.then(function(geoData) {
		//Check that data loaded
		if (geoData == null) {
			console.log("Error loading data");
		} else {
			console.log("Data loaded");
			console.log(geoData);
		
			// append paths with no data to SVG
			mapSvg.append("g")
				.attr("id", "svg-map");
			
			mapSvg.select("#svg-map").selectAll('path')
				.data(geoData.features)
				.enter()
				.append('path')
				.attr('d', mapPath(getHeight("map-wrap"), getWidth("map-wrap")))
				.style('fill', "rgba(0, 0, 0, 0)");
			
			// append g elements for future legends
			legendSvg.append("g")
				.attr("id", "color-legend")
				.attr("transform", "translate(" + ((getWidth("legend-wrap") * colorLegPos) - (legendWidth / 2) ) + ", " + (0) + ")" );
			legendSvg.append("g")
				.attr("id", "alpha-legend")
				.attr("transform", "translate(" + ((getWidth("legend-wrap") * alphaLegPos) - (legendWidth  / 2) ) + ", " + (0) + ")" );
			
			legendSvg.select("#color-legend").append("g");
			legendSvg.select("#alpha-legend").append("g");

			legendSvg.select("#color-legend").append("text")
				.attr("id", "title")
				.attr("x", 5)
				.attr("y", 20)
			
			legendSvg.select("#alpha-legend").append("text")
				.attr("id", "title")
				.attr("x", 5)
				.attr("y", 20)

			// select initial variables to show
			document.getElementById("colorSelect").value = "no_inet";
			document.getElementById("alphaSelect").value = "below_poverty";
			changeVars();			
		}
});

d3.graphScroll()
	.graph(d3.select('#graph'))
	.container(d3.select('#story-container'))
  .sections(d3.selectAll('#story-content > div'))
  .on('active', function(i){ console.log(i + 'th section active') });



