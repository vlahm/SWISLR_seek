<?php

namespace Drupal\swislr_invites\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\RedirectResponse;

class InviteResponseController extends ControllerBase {

  protected function loadInvite($nid, $key) {
    /** @var \Drupal\node\NodeInterface $node */
    $node = Node::load($nid);
    if (!$node || $node->bundle() !== 'suggested_member') {
      return [NULL, 'Invalid invitation.'];
    }
    $stored_key = $node->get('field_invite_key')->value;
    if (!$stored_key || !hash_equals($stored_key, (string) $key)) {
      return [NULL, 'Invalid or expired invitation link.'];
    }
    return [$node, NULL];
  }

  public function accept($nid, $key) {
    [$node, $err] = $this->loadInvite($nid, $key);
    if ($err) {
      return ['#markup' => $this->t($err)];
    }
    if ($node->get('field_invite_status')->value !== 'accepted') {
      $node->set('field_invite_status', 'accepted')->save();
    }
    //$profile = $node->getOwner() ? $node->getOwner()->toUrl('canonical', ['absolute' => TRUE])->toString() : '/';
    //$markup = '<p>You can view the inviter’s profile here: <a href="' . $profile . '">' . $profile . '</a></p>';
    //return ['#type' => 'markup', '#markup' => $markup];
    
    \Drupal::messenger()->addStatus($this->t('Welcome to SWISLR Seek!'));
    return new RedirectResponse('/');
  }

  public function decline($nid, $key) {
    [$node, $err] = $this->loadInvite($nid, $key);
    if ($err) {
      return ['#markup' => $this->t($err)];
    }
    if ($node->get('field_invite_status')->value !== 'declined') {
      $node->set('field_invite_status', 'declined')->save();
    }
    //return ['#type' => 'markup', '#markup' => '<p>Thanks for letting us know.</p>'];
    \Drupal::messenger()->addStatus($this->t('Invitation declined. Thanks for letting us know.'));
    return new RedirectResponse('/');
  }
}

