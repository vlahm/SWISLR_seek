(function (Drupal) {
  Drupal.behaviors.swislrMap = {
    attach: function (context, settings) {
      const map = L.map('map', {
        zoomControl: false
      }).setView([20, 0], 2);

      //L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //  maxZoom: 18,
      //}).addTo(map);
      const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	    maxZoom: 17,
	    attribution: 'Map data: &copy; OpenTopoMap, OSM contributors'
	  });
      const landCover = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Cover_Type_Year/default/2020-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', {
        maxZoom: 9,
        attribution: 'NASA MODIS Land Cover'
      });

      topo.addTo(map);

      const baseMaps = {
        "Topographic": topo,
        "Land Cover": landCover
      };
      
      L.control.layers(baseMaps).addTo(map);

      L.control.zoom({
        position: 'topright'
      }).addTo(map);
    }
  };
})(Drupal);

