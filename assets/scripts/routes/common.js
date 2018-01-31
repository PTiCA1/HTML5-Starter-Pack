export default {
  init() {
    // JavaScript to be fired on all pages
    console.log('pred init');
  },
  finalize() {
    // JavaScript to be fired on all pages, after page specific JS is fired
    console.log('ahoj test');
  },
};
