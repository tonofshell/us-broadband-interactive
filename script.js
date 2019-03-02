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
	mapSvg.transition(transInterval)
		.attr("height", getHeight())
		.attr("width", getWidth());
}

let updateView = function() {
	let h = getHeight();
	let w = getWidth();
	updateMapSize(h, w);
}

let changeMapColorVar = function(newVar) {
	dataPromise.then(function(d){
		let dMin = d3.min(d.features, function(dSub) {return dSub.properties[newVar]});
		let dMax = d3.max(d.features, function(dSub) {return dSub.properties[newVar]});
		let dMed = d3.median(d.features, function(dSub) {return dSub.properties[newVar]});
		
		console.log(newVar + ": range(" + dMin + ", " + dMed + ", " + dMax + ")");
		let newVarScale = function(){return "rgb(0, 0, 0)"};
		if (dMax <= 1 && dMax >= 0) {
			newVarScale = d3.scaleLinear().domain([0, 0.5, 1]).range(["#EB5028", "#E6E673", "#0FA0F5"]);
		} else {
			newVarScale = d3.scaleLinear().domain([dMin, dMed, dMax]).range(["#EB5028", "#E6E673", "#0FA0F5"]);
		}
		
		console.log(newVarScale(dMin) + " " + newVarScale(dMed) + " " + newVarScale(dMax));
		mapSvg.selectAll('path')
				.transition()
				.duration(transInterval)
				.ease(d3.easePolyInOut)
				.style('fill', function(dSub) {
					return newVarScale(dSub.properties[newVar]);
		});
	});
}

let changeMapAlphaVar = function(new_var) {
	
}

//Scripted code

	//Constants
const mapProj = d3.geoAlbersUsa();
const geoGenerator = d3.geoPath().projection(mapProj);
const transInterval = 1000;

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


