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

let updateMapSize = function(h, w) {
	let hProp = (h - oldHeight) / oldHeight; 
	let wProp = (w - oldWidth) / oldWidth;
	mapSvg.transition(transInterval)
		.attr("height", getHeight())
		.attr("width", getWidth())
		.selectAll("path")
		;
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
		let newColorScale = function(){return "rgba(0, 0, 0, 1)"};
		let newAlphaScale = function(){return "1"};
		
		//scales percentages on scale of 0 - 1 if scaleDefault is true, otherwise percentages are scaled from min to max
		if (scaleDefault && dColorMax <= 1 && dColorMax >= 0) {
			newColorScale = d3.scaleLinear().domain([0, 0.5, 1]).range(["#EB5028", "#E6E673", "#0FA0F5"]);
		} else {
			newColorScale = d3.scaleLinear().domain([dColorMin, dColorMed, dColorMax]).range(["#EB5028", "#E6E673", "#0FA0F5"]);
		}
		
		if (scaleDefault && dAlphaMax <= 1 && dAlphaMin >= 0) {
			newAlphaScale = d3.scaleLinear().domain([0, 1]).range([0.1, 1]);
		} else {
			newAlphaScale = d3.scaleLinear().domain([dAlphaMin, dAlphaMax]).range([0.1, 1]);
		}		
		
		console.log(newColorScale(dColorMin) + " " + newColorScale(dColorMed) + " " + newColorScale(dColorMax));
		console.log(newAlphaScale(dAlphaMin) + " " + newAlphaScale(dAlphaMax));
		
		mapSvg.selectAll('path')
				.transition()
				.duration(transInterval)
				.ease(d3.easeCircleIn)
				.style('fill', function(dSub) {
					let colorVal = newColorScale(dSub.properties[colorVar]);
					let alphaVal = newAlphaScale(dSub.properties[alphaVar]);
					
					let trimmedStr = "rgba" + colorVal.substring(3)
					let rebuiltStr = trimmedStr.substring(0, trimmedStr.length - 1) + ", " + alphaVal + ")"
					return rebuiltStr;
		});
	});
}

//Scripted code

	//Constants
const mapProj = d3.geoAlbersUsa();
const geoGenerator = d3.geoPath().projection(mapProj);
const transInterval = 750;

let oldHeight = getHeight();
let oldWidth = getWidth();

let mapSvg = d3.select('#map-wrap')
	.append("svg")
	.attr("height", getHeight)
	.attr("width", getWidth);

	//Get the party started
	//Promise some data
let dataPromise = d3.json("acs_geo_data_simp.geojson")
	
	
dataPromise.then(function(geoData) {
		//Check that data loaded
		if (geoData == null) {
			console.log("Error loading data");
		} else {
			console.log("Data loaded");
			console.log(geoData);
			
			mapSvg.selectAll('path')
				.data(geoData.features)
				.enter()
				.append('path')
				.attr('d', geoGenerator)
/*				.attr('vector-effect', 'non-scaling-stroke')*/
				.style('fill', "#C8DCC8")
		}
	});


