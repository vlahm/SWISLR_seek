<?php

namespace Drupal\swislr_homepage\Controller;

use Drupal\Core\Controller\ControllerBase;

class LandingController extends ControllerBase {
  public function content() {
    return [
      '#theme' => 'swislr_homepage',
      '#attached' => [
        'library' => ['swislr_homepage/swislr-map'],
        'drupalSettings' => [
          'swislrHomepage' => [
            // Set CARTO_API_KEY in .env; docker-compose passes it into the container.
            'cartoApiKey' => getenv('CARTO_API_KEY') ?: '',
          ],
        ],
      ],
    ];
  }
}
