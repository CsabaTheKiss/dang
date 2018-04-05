import axios from 'axios';
import { $ } from './bling';

const DEFAULT_LAT = 43.2;
const DEFAULT_LNG = -79.8;

const mapOptions = {
    center: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
    zoom: 10
};

function loadPlaces(map, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
        .then(res => {
            const places = res.data;
            if (!places.length) {
                alert('no places found!');
                return;
            }

            // create a bounds
            const bounds = new google.maps.LatLngBounds();
            

            const markers = places.map(place => {
                const [placeLng, placeLat] = place.location.coordinates;
                const position = { lat: placeLat, lng: placeLng };
                bounds.extend(position); // creates a perfectly placed rectangle around the markers for zoom
                const marker = new google.maps.Marker({ map, position }); // placing marker on the google maps
                marker.place = place;
                return marker;
            });

            // zoom the map to fit all the markers perfectly
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);
        });
};

function makeMap(mapDiv) {
    if (!mapDiv) { return; };
    // make our map
    const map = new google.maps.Map(mapDiv, mapOptions);
    loadPlaces(map);
    const input = $('[name="geolocate"]');
    const autocomplete = new google.maps.places.Autocomplete(input);
};

export default makeMap;
