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

            const bounds = new google.maps.LatLngBounds();
            const infoWindow = new google.maps.InfoWindow();

            const markers = places.map(place => {
                const [placeLng, placeLat] = place.location.coordinates;
                const position = { lat: placeLat, lng: placeLng };
                bounds.extend(position); // creates a perfectly placed rectangle around the markers for zoom
                const marker = new google.maps.Marker({ map, position }); // placing marker on the google maps
                marker.place = place;
                return marker;
            });

            // when someone clicks on a marker, show the details of that place
            markers.forEach(marker => marker.addListener('click', function () {
                // will be part of the page, not in an iframe or such
                const html = `
                    <div class="popup">
                        <a href="/store/${this.place.slug}">
                            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
                            <p>${this.place.name} - ${this.place.location.address}</p>
                    </div>
                `;
                infoWindow.setContent(html);
                infoWindow.open(map, this);
            }));

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
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
        }
    });
};

export default makeMap;
