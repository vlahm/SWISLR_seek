<?php

namespace Drupal\swislr_homepage\Controller;

use Drupal\Core\Controller\ControllerBase;

class LandingController extends ControllerBase {
  public function content() {
    return [
      '#theme' => 'swislr_homepage',
      '#attached' => ['library' => ['swislr_homepage/swislr-map']],
    ];
  }
}

