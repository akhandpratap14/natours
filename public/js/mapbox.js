const locations = JSON.parse(document.getElementById('map').dataset.locations);

console.log(locations);

console.log('Hello from the client side');

mapboxgl.accessToken = 'pk.eyJ1IjoiYWtoYW5kcHJhdGFwcmFpIiwiYSI6ImNsazU3ZmVkNDAyamwzcG54N29vcTNrcnQifQ.S_skymuqduIWo3qJ_BHpkA';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/akhandprataprai/clk5ahz5g00im01pe96h4g1dm',
  scrollZoom: false
//   center: [-118.113491, 34.111745],
//   zoom: 10,
//   interactive: false
});

const bounds =  new mapboxgl.LngLatBounds();

locations.forEach(loc => {

    // CREATE MARKER 
    const el = document.createElement('div');
    el.className = 'marker';

    // ADD MARKER 
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    // ADD POPUP 

    new mapboxgl.Popup({
        offset: 30
    })
    .setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);

    // Extend MAP BOUNDS TO INCLUDE THE CURRENT LOCATION 
    bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
    padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
    }
});

