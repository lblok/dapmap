///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// MODULE IMPORTS
///////////////////////////////////////////////////////////////////////////////////////////////////////////

import './index.scss';
import styles from './css_modules/variables.module.scss';

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// DATA AND CONFIG CONSTANTS
///////////////////////////////////////////////////////////////////////////////////////////////////////////

const DATA = {};
const CONFIG = {};

// Map config
CONFIG.startzoom = 12;
CONFIG.startlat  = 40.7381;
CONFIG.startlng  = -73.9423;

// Color config
CONFIG.colordefs = {
  stabloss: [
    'case',
    // color gray if missing is True
    ['==', ['get', 'missing'], 'True'],
    '#a7a7a7',
    // from there color by stabloss
    ['step',
    ['get', 'stabloss'],
    'transparent', // this one should be the default match if nothing below matches
    -9999, 'transparent', // -9999 
    -1, '#bd0026',        // -9998 to -1
    -0.95, '#fc4e2a',     
    -0.75, '#fd8d3c', 
    -0.5, '#feb24c', 
    -0.25, '#fed976',
    -0.1, '#ffffcc',
    ]
  ],
  ppuval: [
    'case',
    ['==', ['get', 'ppuval'], null],
    'transparent',
    ['step', 
    ['get', 'ppuval'],
    'transparent',
    100000, '#ffffcc',
    200000, '#feb24c',
    350000, '#fd8d3c',
    500000, '#fc4e2a',
    750000, '#bd0026',
    1000000,'#800026',
    ]
  ],
  violscore: [
    'case',
    ['==', ['get', 'violscore'], null],
    'transparent',
    ['step', 
    ['get', 'violscore'],
    'transparent',
    10, '#ffffcc',
    25, '#feb24c',
    50, '#fd8d3c',
    100, '#fc4e2a',
    200, '#bd0026',
    500, '#800026',
    ]
  ],
  evicscore: [
    'case',
    ['==', ['get', 'evicscore'], null],
    'transparent',
    ['step', 
    ['get', 'evicscore'],
    'transparent',
    5, '#ffffcc',
    20, '#feb24c',
    33, '#fd8d3c', 
    50, '#fc4e2a', 
    100, '#bd0026', 
    150, '#800026',
    ]
  ],
}

// label config and properties
CONFIG.label_layout_properties = {
  visibility: 'none',
  'icon-image': 'fake-icon',
  // get the label from the geojson source
  'text-field': ['get', 'label'],
  'text-font': [
      'Open Sans Semibold',
  ],
  'text-offset': [0, -1],
  'text-anchor': 'top',
  'text-size': 27,
};

// Map tile config
CONFIG.taxlots_url = 'https://anhd-dap-maptiles.s3.us-west-1.amazonaws.com/allzooms.pmtiles';

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// INITIALIZATION: these functions are called when the page is ready
///////////////////////////////////////////////////////////////////////////////////////////////////////////

$(document).ready(function () {
  Promise.all([
      initData('./data/council.json', 'json'),
      initData('./data/council_centroids.json', 'json'),
      initData('./data/boards.json', 'json'),
      initData('./data/boards_centroids.json', 'json'),
      initData('./data/zip.json', 'json'),
      initData('./data/zip_centroids.json', 'json'),
      initData('./images/1x1.png', 'image'),
    ]).then(function(data) {
      initDataFormat(data);
      initButtons();
      initMap();
      initGeocoder();
      initApp();

  console.log('%c DATA', 'color: green', DATA);
  console.log('%c CONFIG', 'color: blue', CONFIG);

  }); // Promise.then()
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// INIT FUNCTIONS CALLED ON DOC READY
///////////////////////////////////////////////////////////////////////////////////////////////////////////

// entry point for the application. We could include parsing of query params here, or not
function initApp() {
  // show Modal intro on page load, unless they've requested not to
  if (! Cookies.get('dap-no-intro') ) {
    $('div#openModal.modalDialog').show();
    
    // set cookie if don't show this message is checked
    $('#toggleIntroCookie').on('change', function() {
      if($(this).is(":checked")) {
        Cookies.set('dap-no-intro', 'dap-no-intro', { expires: 365, path: '/' });
      } else {
        Cookies.remove('dap-no-intro', { path: '/' });
      }
    });
  }
}

// Basic data init, returns a promise
function initData(url, type) {
  // wrap this in a promise, so we know we have it before continuing on to remaining initialize steps
  return new Promise(function(resolve, reject) {
    fetch(url).then(function(response) {
      if (type === 'csv') return response.text();
      if (type === 'json') return response.json();
      if (type === 'image') return response.blob();
    }).then(function(data) {
      resolve(data);
    });
  })
}

// Data formatting routines, to get the static, raw data files into the form we need it in
function initDataFormat(data) {
  DATA.council           = data[0];
  DATA.council_centroids = data[1]; 
  DATA.boards            = data[2];
  DATA.boards_centroids  = data[3];
  DATA.zip               = data[4];
  DATA.zip_centroids     = data[5];
  DATA.empty_glpyh       = data[6];
}


// Layer buttons, other buttons, help tooltips, etc.
function initButtons() {

  // init the taxlot layer switching buttons
  $('button.layerbtn').not('.geolayer').on('click', function() {
    const button = $(this);
    const layer = button.data('layer');

    // if already selected, then select nothing and clear the taxlots from the map
    if (button.hasClass('selected')) {
      button.removeClass('selected');
      CONFIG.map.setLayoutProperty('taxlots-id', 'visibility', 'none');
    } else {
      // otherwise, we have a new selection
      $('button.layerbtn').removeClass('selected');
      button.addClass('selected');

      // update the paint property and field
      CONFIG.map.setPaintProperty('taxlots-id', 'fill-color', CONFIG.colordefs[layer]);

      // close any leftover open popups
      CONFIG.map.fire('closeAllPopups');

      // check layer visibility: if 'none' then make visible as a last step
      const visibility = CONFIG.map.getLayoutProperty('taxlots-id', 'visibility');
      if (visibility === 'none') CONFIG.map.setLayoutProperty('taxlots-id', 'visibility', 'visible')
    }
  });

  // init the geolayer geojson overlay buttons
  $('button.geolayer').on('click', function() {
    const button = $(this);
    const layer = button.data('layer');

    // if already selected, then select nothing and clear the geojson layer from the map
    if (button.hasClass('btnactive')) {
      button.removeClass('btnactive');
      CONFIG.map.setLayoutProperty(layer, 'visibility', 'none');
      CONFIG.map.setLayoutProperty(`${layer}-labels`, 'visibility', 'none');
    } else {
      // otherwise, make it and the companion labels layer visible
      button.addClass('btnactive');
      CONFIG.map.setLayoutProperty(layer, 'visibility', 'visible');
      CONFIG.map.setLayoutProperty(`${layer}-labels`, 'visibility', 'visible');
    }
  }); 

  // geography selects
  $('select.geoselect').on('change', function() {
    const select = $(this);
    const layer = select.data('layer');
    const place = select.val();

    // turn off all other layers but this one
    ['council', 'boards', 'zip'].forEach(function(l) {
      if (layer == l) return;
      $(`button.layerbtn[data-layer=${l}`).removeClass('btnactive');
      CONFIG.map.setLayoutProperty(l, 'visibility', 'none');
      $(`select.geoselect[data-layer=${l}]`).val('0');
    })

    // if the layer is not yet on, turn it on...
    const visibility = CONFIG.map.getLayoutProperty(layer, 'visibility');
    $(`button.layerbtn[data-layer=${layer}`).addClass('btnactive');
    if (visibility === 'none') CONFIG.map.setLayoutProperty(layer, 'visibility', 'visible');

    // then find and zoom to the extent of the place
    const feature = DATA[layer].features.filter(function(d) {return d.properties.dist == place});
    const geom = feature[0].geometry.coordinates;
    const bbox = getPolygonBoundingBox(geom);
    CONFIG.map.fitBounds(bbox);
  });


  // init help tooltips
  $('div.help-tip').on('click', function() {
    // first close any that may still be open
    $('div.help-tip div.tip-outer').hide();
    // then open _this_ one
    $(this).find('div.tip-outer').show();
  });

  $('div.tip-outer div.close-tip').on('click', function() {
    $(this).parent().hide();
    return false;
  });

  // splash close
  $('.modalDialog a.close').on('click', function() {
    $('.modalDialog').hide();
  });


}

// Map inits
function initMap() {
  // Map setup
  CONFIG.map = new maplibregl.Map({
    container: 'map',
    hash: 'view',
    // Without a style, map.on('load') never resolves
    // so even though we could declare this layer elsewhere, might as well do that here
    // and we can also declare the glyph that is required for the text labels
    style: {
      version: 8,
      sources: {
        dark_custom_basemap: {
          type: 'raster',
          tiles: [
            'https://api.mapbox.com/styles/v1/lblok/cjk4889sb29b12splkdw0pzop/tiles/512/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGJsb2siLCJhIjoiY2o3djQ2ODd4MnVjMjJwbjBxZWZtZDB2ZiJ9.4gctlFUX_n0BzOAwbuL2aw',
          ],
          tileSize: 512,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
      },
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      layers: [
        {
          id: 'dark_custom_basemap-id',
          type: 'raster',
          source: 'dark_custom_basemap'
        },
      ],
    },
    center: [CONFIG.startlng, CONFIG.startlat],
    zoom: CONFIG.startzoom,
  });

  // PMTiles setup:
  // add the PMTiles plugin to the maplibregl global.
  let protocol = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles',protocol.tile);

  // Additional layers and centroid labels must be configured after the map loads
  // so wait for that
  CONFIG.map.on('load', function() { loadMapSources() });
}

// load map source and layers, once map is finished "loading"
function loadMapSources() {
    //
    // Add map sources
    //

    // Add taxlots PMTiles
    CONFIG.map.addSource('taxlots', {
      type: 'vector',
      url: `pmtiles://${CONFIG.taxlots_url}`,
      minzoom: 9,
      maxzoom: 22
    });

    // add geojson sources
    CONFIG.map.addSource('council', {
      type: 'geojson',
      data: DATA.council
    });

    CONFIG.map.addSource('council_centroids', {
      type: 'geojson',
      data: DATA.council_centroids,
    });

    CONFIG.map.addSource('boards', {
      type: 'geojson',
      data: DATA.boards
    });

    CONFIG.map.addSource('boards_centroids', {
      type: 'geojson',
      data: DATA.boards_centroids
    });

    CONFIG.map.addSource('zip', {
      type: 'geojson',
      data: DATA.zip
    });

    CONFIG.map.addSource('zip_centroids', {
      type: 'geojson',
      data: DATA.zip_centroids
    });

    //
    // Add map layers
    //
    CONFIG.map.addLayer({
      id: 'taxlots-id',
      source: 'taxlots',
      'source-layer': 'taxlots_4326',
      type: 'fill',
      paint: {
        'fill-opacity': 0.8,
        // DEBUG:
        // 'fill-color': 'steelblue',
        // 'fill-outline-color': 'darkblue',
        // On load: default to showing stabloss
        'fill-color': CONFIG.colordefs.stabloss,
      },
    });

    CONFIG.map.addLayer({
      id: 'council',
      type: 'line',
      source: 'council',
      layout: {
        visibility: 'none',
      },
      paint: {
        'line-color': '#fff',
        'line-width': 2,
      }
    });

    CONFIG.map.addLayer({
      id: 'boards',
      type: 'line',
      source: 'boards',
      layout: {
        visibility: 'none',
      },
      paint: {
        'line-color': '#e87fe4',
        'line-width': 2,
      }
    });

    CONFIG.map.addLayer({
      id: 'zip',
      type: 'line',
      source: 'zip',
      layout: {
        visibility: 'none',
      },
      paint: {
        'line-color': '#9ce976',
        'line-width': 2,
      }
    });    

    // CURSOR
    CONFIG.map.on('mouseenter', 'taxlots-id', () => {
      CONFIG.map.getCanvas().style.cursor = 'crosshair';
    });

    CONFIG.map.on('mouseleave', 'taxlots-id', () => {
      CONFIG.map.getCanvas().style.cursor = 'default';
    });


    // POPUP
    CONFIG.map.on('click', 'taxlots-id', e => {
      const features = CONFIG.map.queryRenderedFeatures(e.point, { layers: ['taxlots-id'] });

      if (features.length > 0) {
        const { state, properties } = features[0];

        // Create the inital popup HTML
        let html = $('<div class="popup"></div>');
        $('<button class="maplibregl-popup-close-button"></button>').appendTo(html);
        let wrapper = $('<div class="popup-content-wrapper">').appendTo(html);
        let header = $('<div class="popup-header"></div>').appendTo(wrapper);
        header.html(`<h2>${properties.address}</h2>`);
        let content = $('<div class="popup-content"></div>').appendTo(wrapper);
        content.html(`<h3>${properties.borough} ${properties.zipcode}</h3><span class="bbl">BBL: ${properties.bbl}</span>`);

        // layer specific content switch
        let active_layer = $('button.layerbtn.selected').data('layer');
        switch (active_layer) {
          case 'stabloss':
            getStablossPopupContent(properties, html);
            break;

          case 'ppuval': 
            getPpuvalPopupContent(properties, html);
            break; 

          case 'violscore':
            getViolscorePopupContent(properties, html);
            break; 

          case 'evicscore':
            getEvicsorePopupContent(properties, html);
            break; 

          default:
            console.log('Missing a layer type!');
        }

        // always add a DAP link for this property
        $(`<strong><a class="dap-link" target="_blank" href="https://portal.displacementalert.org/property/${properties.bbl}">DAP Portal</a><strong>`).appendTo(html);

        // All set: open the popup on the map
        const popup = new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(html.html())
          .addTo(CONFIG.map);


        // set a custom event handler to close any open popup
        CONFIG.map.on('closeAllPopups', function() {
          popup.remove();
        });
      }
    });

    // DEBUG
    // CONFIG.map.showTileBoundaries = true;

    // CONFIG.map.on('zoomend', function() { 
    //   let zoom = this.getZoom();
    //   console.log(zoom);
    // });

    // 
    // LABELS 
    // 
    CONFIG.map.loadImage(
      // labels must be anchored on an image, we'll use a 1x1 transparent png
      './images/1x1.png',
      (error, image) => {
        if (error) throw error;
        CONFIG.map.addImage('fake-icon', image);
      
        // continue centroid loading now that we have an image loaded
        CONFIG.map.addLayer({
          id: 'council-labels',
          type: 'symbol',
          source: 'council_centroids',
          layout: CONFIG.label_layout_properties,
          paint: {
            'text-color': '#FFF',
          },
        });

        CONFIG.map.addLayer({
          id: 'boards-labels',
          type: 'symbol',
          source: 'boards_centroids',
          layout: CONFIG.label_layout_properties,
          paint: {
            'text-color': '#e87fe4',
          },
        });
      
        CONFIG.map.addLayer({
          id: 'zip-labels',
          type: 'symbol',
          source: 'zip_centroids',
          layout: CONFIG.label_layout_properties,
          paint: {
            'text-color': '#9ce976',
          },
        });

      }
    )

}

function getStablossPopupContent(properties, wrapper) {
  let content = $('<div class="popup-content"></div>').appendTo(wrapper);
  let val = properties.numbldgs || 'N/A';
  content.html(`<p>Number of Buildings: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.unitsres || '0';
  content.html(`<p>Residential Units: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.yearbuilt || 'N/A';
  content.html(`<p>Year Built: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.uc2007 || 'Missing';
  content.html(`<p>Stabilized Units in 2007: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.uc2019 || 'Missing';
  content.html(`<p>Stabilized Units in 2019: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.uc2020 || 'Missing';
  content.html(`<p>Stabilized Units in 2020: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.uc2021 || 'Missing';
  content.html(`<p>Stabilized Units in 2021: <strong>${val}</strong></p>`);

  // // DEBUG
  // content = $('<div class="popup-content"></div>').appendTo(wrapper);
  // val = properties.stabloss || 'null';
  // content.html(`<p style="color: red">STABLOSS: <strong style="color: red">${val}</strong></p>`);  

  // content = $('<div class="popup-content"></div>').appendTo(wrapper);
  // val = properties.missing || 'null';
  // content.html(`<p style="color: red">MISSING: <strong style="color: red">${val}</strong></p>`);  

  // // END DEBUG

  let final = +properties.uc2021;
  let initial = +properties.uc2019;
  let change = ((final - initial) / initial); 

  // check missing attribute, for a switch on content
  if (properties.missing === 'True') {
    $('<div class="popup-content"><p><strong>This property has not registered stabilized units since 2019.</strong></p></div>').appendTo(wrapper);
  } else {
    // Not "missing": add a "percent change" line
    if (final && initial) {
      content = $('<div class="popup-content"></div>').appendTo(wrapper);
      change = change.toLocaleString('en-US', {style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0}) || 'N/A';        
      content.html(`<p>Percent Change since 2019: <strong>${change}</strong></p>`);      
    } else {
      change = 'N/A';
    }
  }
}

function getPpuvalPopupContent(properties, wrapper) {
  let content = $('<div class="popup-content"></div>').appendTo(wrapper);
  let val = properties.numbldgs || 'N/A';
  content.html(`<p>Number of Buildings: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.unitsres || '0';
  content.html(`<p>Residential Units: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.unitscomm || '0';
  content.html(`<p>Commercial Units: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.sale_date || 'N/A';
  if (val != 'N/A') {
    // reformat from YYYY-MM-DD as given to mm/dd/yyyy
    const parts = val.split('-');
    val = `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  content.html(`<p>Sale Date: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.sale_price || 'N/A';
  if (val != 'N/A') val = val.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0});
  content.html(`<p>Sale Price: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.ppuval || 'N/A';
  if (val != 'N/A') val = val.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0});
  content.html(`<p>Price per Unit: <strong>${val}</strong></p>`);
}

function getViolscorePopupContent(properties, wrapper) {
  let content = $('<div class="popup-content"></div>').appendTo(wrapper);
  let val = properties.numbldgs || 'N/A';
  content.html(`<p>Number of Buildings: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.unitsres || '0';
  content.html(`<p>Residential Units: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.unitscomm || '0';
  content.html(`<p>Commercial Units: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.violations || '0';
  content.html(`<p>Open Class C Violations: <strong>${val}</strong></p>`);
}

function getEvicsorePopupContent(properties, wrapper) {
  let content = $('<div class="popup-content"></div>').appendTo(wrapper);
  let val = properties.numbldgs || 'N/A';
  content.html(`<p>Number of Buildings: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.unitsres || '0';
  content.html(`<p>Residential Units: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.unitscomm || '0';
  content.html(`<p>Commercial Units: <strong>${val}</strong></p>`);

  content = $('<div class="popup-content"></div>').appendTo(wrapper);
  val = properties.evictions || '0';
  content.html(`<p>Evictions: <strong>${val}</strong></p>`);
}

function initGeocoder() {
  const geocoder_api = {
    forwardGeocode: async(config) => {
      const features = []
      return new Promise(async(resolve) => {
        try {
          let request = "https://geosearch.planninglabs.nyc/v2/autocomplete?text=" + config.query;
          const response = await fetch(request);
          const geojson = await response.json();
          for (let feature of geojson.features) {
            let point = {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
              },
              place_name: feature.properties.label,
              properties: feature.properties,
              text: feature.properties.label,
              place_type: ["place"],
              center: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
            }
            features.push(point);
          }
        } catch (e) {
          console.error(`Failed to forwardGeocode with error: ${e}`);
        }
        resolve({
          features: features,
        });
      });
    },
  };

  CONFIG.map.addControl(
    new MaplibreGeocoder(geocoder_api, {
      maplibregl: maplibregl,
      placeholder: 'Search address',
      minLength: 3,
      showResultsWhileTyping: true,
      bbox: [-74.63172, 40.22950, -72.047772, 41.57307],
    }),
    'top-left',
  );
}


// Shims and utilities
function getPolygonBoundingBox(arr, bounds = [[], []]) {
  for (var i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i][0][0])){
      bounds = getPolygonBoundingBox(arr[i], bounds);
    } else {
      const polygon = arr[i];
      for (var j = 0; j < polygon.length; j++) {
        const longitude = polygon[j][0];
        const latitude = polygon[j][1];
        bounds[0][0] = bounds[0][0] < longitude ? bounds[0][0] : longitude;
        bounds[1][0] = bounds[1][0] > longitude ? bounds[1][0] : longitude;
        bounds[0][1] = bounds[0][1] < latitude ? bounds[0][1] : latitude;
        bounds[1][1] = bounds[1][1] > latitude ? bounds[1][1] : latitude;
      }
    }
  }
  return bounds;
}