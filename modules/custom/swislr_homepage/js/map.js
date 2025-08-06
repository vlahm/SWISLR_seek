(function (Drupal) {
  Drupal.behaviors.swislrMap = {
    attach: function (context, settings) {
      const map = L.map('map').setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);
    }
  };
})(Drupal);

