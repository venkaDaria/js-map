const mapInfo = {
  markers: [],
  lines: []
};

var map, directionsService, placeService;
var remembered, buildMode = false;

function initMap() {
	map = new google.maps.Map($("#mapSurface")[0], {
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  });

	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(geolocationSuccess, geolocationFailure);
	} else {
		geolocationFailure();
	}

	map.addListener('click', function(e) {
		placeMarker(map, e.latLng);
	});

  function geolocationSuccess(position) {
  	const lat = position.coords.latitude;
  	const lon = position.coords.longitude;

    directionsService = new google.maps.DirectionsService();
    placeService = new google.maps.places.PlacesService(map)

  	map.setCenter(new google.maps.LatLng(lat, lon));
  }

  function geolocationFailure(positionError) {
  	alert("Ваш браузер не поддерживает геолокацию");
  }
}

function placeMarker(map, position) {
  const getMarker = function(map, position) {
    return new google.maps.Marker({
  		position: position,
  		map: map,
  		title: position.lat() + ", " + position.lng()
  	});
  }

  const filter = function(marker) { return marker.position !== position };

  const marker = getMarker(map, position);
  mapInfo.markers.push(marker);
  map.panTo(position);

  marker.addListener('dblclick', function(e) {
    marker.setMap(null);
    mapInfo.markers = mapInfo.markers.filter(filter);
  });

  const infoWindow = new google.maps.InfoWindow();

  const buildInfoWindow = function(results, status) {
    if (status !== google.maps.places.PlacesServiceStatus.OK)
      return;

    const placesInfo = results.reduce(function(previousValue, currentValue) {
        return previousValue + currentValue.name + "<br/>";
    }, "");

    marker.addListener('click', function(e) {
      if (buildMode && remembered) {
        buildLine(remembered, marker);
        remembered = undefined;
      } else if (buildMode) {
        remembered = marker;
      } else {
        infoWindow.setContent('<div>' + placesInfo + '</div>');
        infoWindow.open(map, this);
      }
    });
  }

  const buildLine = function(start, end) {
    const request = {
      origin: start.position,
      destination: end.position,
      travelMode: 'DRIVING'
    };

    const renderRoute = function(response) {
      const directionsRenderer = new google.maps.DirectionsRenderer({ preserveViewport: true });
      directionsRenderer.setMap(map);
      directionsRenderer.setDirections(response);
      mapInfo.lines.push(directionsRenderer);
    }

    directionsService.route(request, function(response, status) {
      if (status == 'OK') {
        renderRoute(response)
      } else {
        alert("directions request failed, status=" + status)
      }
    });
  };

  placeService.nearbySearch({
      location: position,
      radius: '500',
  }, buildInfoWindow);
}

function changeMode(mode) {
  buildMode = mode;
}

function hideRoutes() {
  mapInfo.lines.forEach(function(directionsDisplay) {
     directionsDisplay.setMap(null)
  });
}

function showRoutes() {
  mapInfo.lines.forEach(function(directionsDisplay) {
     directionsDisplay.setMap(map);
  });
}

function hideMarkers() {
  mapInfo.markers.forEach(function(marker) {
     marker.setMap(null);
  });
}

function showMarkers() {
  mapInfo.markers.forEach(function(marker) {
     marker.setMap(map);
  });
}

function clearAll() {
  clearMarkers();
  clearRoutes();
}

function clearMarkers() {
  hideMarkers();
  mapInfo.coords = [];
}

function clearRoutes() {
  hideRoutes();
  mapInfo.lines = [];

  remembered = undefined;
  buildMode = false;
}
