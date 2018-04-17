export default {
  init() {

    // JavaScript to be fired on all pages
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js');

    console.log('common -- init');

  },
  finalize() {
    // JavaScript to be fired on all pages, after page specific JS is fired
    console.log('common -- finalize');
  },
};
