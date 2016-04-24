var yourLocation = {lat:50.718412, lon:-3.533899},
	map = L.map('map').setView([yourLocation.lat, yourLocation.lon], 8),
	aircraftHistory = {},
	markers = new L.FeatureGroup(),
	tracks = new L.FeatureGroup(),
	marker,
	track,
	aircraftIcon = L.icon({
		iconUrl: 'images/Liner.png',
		iconSize:     [20, 20], // size of the icon
		iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
		popupAnchor:  [-3, -10] // point from which the popup should open relative to the iconAnchor
	}),
	getContrailProbability = function (altitude) {
		if (altitude > 350) {
			return 'red';
		} else if (altitude > 300) {
			return 'orange';
		} else {
			return 'green';
		}
	},
	plotAircraft = function () {
		map.removeLayer(markers);
		map.removeLayer(tracks);
		markers = new L.FeatureGroup();
		for (var aircraft in aircraftHistory) {
			if (aircraftHistory.hasOwnProperty(aircraft)) {
				var positions = aircraftHistory[aircraft].positions,
					position = positions[positions.length - 1];
				marker = L.marker([position.lat, position.lon], {icon: aircraftIcon, rotationAngle: -45 + aircraftHistory[aircraft].heading , rotationOrigin: 'center'});
				marker.bindPopup('<p>Aircraft: ' + aircraftHistory[aircraft].type + '<br>Altitude: FL' + aircraftHistory[aircraft].altitude + '<br>Departure: ' + aircraftHistory[aircraft].origin + '<br>Destination: ' + aircraftHistory[aircraft].destination + '</p>', {
					showOnMouseOver: true
				});
				marker.on('mouseover', function () {
					this.openPopup();
				});
				var arcPositions = [];
				if (positions.length !== 0) {
					for (var i = 0; i < positions.length; i++) {
						arcPositions.push([positions[i].lat, positions[i].lon]);
					}
					track = L.polyline(arcPositions, {color: getContrailProbability(aircraftHistory[aircraft].altitude)});
					tracks.addLayer(track);
				}
				markers.addLayer(marker);
			}
		}
		map.addLayer(markers);
		map.addLayer(tracks);
	},
	buildHistory = function (aircraft) {
		for (var i=0; i < aircraft.length; i++) {
			if (aircraftHistory[aircraft[i].ident]) {
				aircraftHistory[aircraft[i].ident].positions.push({lat: aircraft[i].latitude, lon: aircraft[i].longitude});
			} else {
				aircraftHistory[aircraft[i].ident] = {
					heading: aircraft[i].heading,
					type: aircraft[i].type,
					origin:aircraft[i].origin,
					altitude:aircraft[i].altitude,
					destination:aircraft[i].destination,
					positions: [{lat: aircraft[i].latitude, lon: aircraft[i].longitude}]
				}
			}
		}
	},
	getAndPlotAircraft = function () {
		$.ajax({
			url: 'http://rachelPrudden:a3db0b3725f7a4f4a20525e78afe557cecdc554c@flightxml.flightaware.com/json/FlightXML2/Search',
			data: {
				query: '-aboveAltitude 250 -latlong  {52.143602 -6.300659 49.869857 -1.049194}'
			},
			success: function (result) {
				buildHistory(result.SearchResult.aircraft);
				plotAircraft(result.SearchResult.aircraft);
			},
			dataType: 'jsonp',
			jsonp: 'jsonp_callback',
			xhrFields: {withCredentials: true}
		});
	};
$(document).ready(function () {
	L.marker([yourLocation.lat,yourLocation.lon]).addTo(map);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}).addTo(map);
	getAndPlotAircraft();
	window.setInterval(function(){
		getAndPlotAircraft();
	}, 5000);
});