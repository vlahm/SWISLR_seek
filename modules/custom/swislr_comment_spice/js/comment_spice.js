(function (Drupal, once) {
  Drupal.behaviors.swislrCommentSpice = {
    attach(context) {
      // Smooth scroll when a link targets #comment-form.
      once('sw-scroll', 'a[href="#comment-form"]', context).forEach(a => {
        a.addEventListener('click', (e) => {
          const target = document.getElementById('comment-form') || document.getElementById('sw-comments');
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const ta = target.closest('form')?.querySelector('textarea');
            if (ta) ta.focus();
          }
        });
      });

      // Autosize the textarea in core comment forms.
      once('sw-autosize', 'form.comment-form textarea', context).forEach((ta) => {
        const resize = () => {
          ta.style.height = 'auto';
          ta.style.height = ta.scrollHeight + 'px';
        };
        ta.addEventListener('input', resize);
        resize();
      });
    }
  };
})(Drupal, once);

