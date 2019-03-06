//Javascript document

//Functions
let getHeight = function() {
	let hei = document.getElementById('map-wrap').offsetHeight;
	console.log("Current height: " + hei);
	return hei;
}

let getWidth = function() {
	let wid = document.getElementById('map-wrap').offsetWidth;
	console.log("Current width: " + wid);
	return wid;
}

let mapPath = function() {
	let hScale = getHeight() / 1000 * 1900;
	let wScale = getWidth() / 875 * 1200;
	let centerH = getHeight() / 2;
	let centerW = getWidth() / 2;
	
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
	mapSvg.transition(transInterval)
		.attr("height", getHeight())
		.attr("width", getWidth())
		.selectAll("path")
		.attr('d', mapPath());
}

let updateView = function() {
	let h = getHeight();
	let w = getWidth();
	updateMapSize(h, w);
	oldHeight = h;
	oldWidth = w;
}

let changeVars = function() {
	let cSelector = document.getElementById("colorSelect");
	let cValue = cSelector[cSelector.selectedIndex].value;
	let aSelector = document.getElementById("alphaSelect");
	let aValue = aSelector[aSelector.selectedIndex].value;
	console.log(cValue + " " + aValue);
	changeMapVars(cValue, aValue, false);
}

let changeMapVars = function(colorVar, alphaVar, scaleDefault) {
	dataPromise.then(function(d){
		let dColorMin = d3.min(d.features, function(dSub) {return dSub.properties[colorVar]});
		let dColorMax = d3.max(d.features, function(dSub) {return dSub.properties[colorVar]});
		let dColorMed = d3.median(d.features, function(dSub) {return dSub.properties[colorVar]});
		
		let dAlphaMin = d3.min(d.features, function(dSub) {return dSub.properties[alphaVar]});
		let dAlphaMax = d3.max(d.features, function(dSub) {return dSub.properties[alphaVar]});
		
		console.log(colorVar + ": range(" + dColorMin + ", " + dColorMed + ", " + dColorMax + ")");
		
		// define some scale variables
		let newColorScale = function(){return "rgba(0, 0, 0, 1)"};
		let newAlphaScale = function(){return "1"};
		let alphaLegendScale = function(){return "rgba(0, 0, 0, 1)"}
		
		// actually make the scales
		//scales percentages on scale of 0 - 1 if scaleDefault is true, otherwise percentages are scaled from min to max
		/*if (scaleDefault && dColorMax <= 1 && dColorMax >= 0) {
			newColorScale = d3.scaleLinear().domain([0, 0.5, 1]).range(["#EB5028", "#E6E673", "#0FA0F5"]).unknown("#000");
		} else {
			newColorScale = d3.scaleLinear().domain([dColorMin, dColorMed, dColorMax]).range(["#EB5028", "#E6E673", "#0FA0F5"]).unknown("#000");
		}*/

		if (scaleDefault && dColorMax <= 1 && dColorMax >= 0) {
			newColorScale = d3.scaleLinear().domain([0, 1]).range(["#EB5028", "#000"]).unknown("#fff");
		} else {
			newColorScale = d3.scaleLinear().domain([dColorMin, dColorMax]).range(["#EB5028", "#000"]).unknown("#fff");
		}
		
		if (scaleDefault && dAlphaMax <= 1 && dAlphaMin >= 0) {
			newAlphaScale = d3.scaleLinear().domain([0, 1]).range([0.2, 1]).unknown(0);
			alphaLegendScale = d3.scaleLinear().domain([0, 1]).range(["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 1)"]).unknown(0)
		} else {
			newAlphaScale = d3.scaleLinear().domain([dAlphaMin, dAlphaMax]).range([0.2, 1]).unknown(0);
			alphaLegendScale = d3.scaleLinear().domain([dAlphaMin, dAlphaMax]).range(["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 1)"]).unknown(0)
		}		
		
		console.log(newColorScale(dColorMin) + " " + newColorScale(dColorMed) + " " + newColorScale(dColorMax));
		console.log(newAlphaScale(dAlphaMin) + " " + newAlphaScale(dAlphaMax));
		
		// show data on chloropleth
		mapSvg.selectAll('path')
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
		
		// make some legends
		let colorLegend = d3.legendColor()
			.shapeWidth(50)
			.shapePadding(0)
			.labelFormat(d3.format(".2f"))
			.scale(newColorScale)
			.orient('horizontal');

		mapSvg.select("#color-legend")
			.call(colorLegend);
		
		let alphaLegend =  d3.legendColor()
			.shapeWidth(40)
			.shapePadding(0)
			.labelFormat(d3.format(".2f"))
			.scale(alphaLegendScale)
			.orient('horizontal');
		
		mapSvg.select("#alpha-legend")
			.call(alphaLegend);
		
	});
}

//Scripted code

	//Constants
const transInterval = 750;

let mapSvg = d3.select('#map-wrap')
	.append("svg")
	.attr("height", getHeight())
	.attr("width", getWidth());

	//Get the party started
	//Promise some data
let dataPromise = d3.json("acs_geo_data_simp.geojson")
	

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
			mapSvg.selectAll('path')
				.data(geoData.features)
				.enter()
				.append('path')
				.attr('d', mapPath())
/*				.attr('vector-effect', 'non-scaling-stroke')*/
				.style('fill', "#C8DCC8");
			
			// append g elements for future legends
			mapSvg.append("g")
				.attr("id", "color-legend")
				.attr("transform", "translate(" + (getWidth() * 0.5) + ", " + (getHeight() * 0.1) + ")" );
			
			mapSvg.append("g")
				.attr("id", "alpha-legend")
				.attr("transform", "translate(" + (getWidth() * 0.70) + ", " + (getHeight() * 0.70) + ")" );
			
			// select initial variables to show
			document.getElementById("colorSelect").value = "no_inet";
			document.getElementById("alphaSelect").value = "below_poverty";
			changeVars();			
		}
	});


