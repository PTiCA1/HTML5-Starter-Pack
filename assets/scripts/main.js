// import external dependencies
import 'jquery';

import Popper from 'popper.js';
window.Popper = Popper;

// Bootstap
// @link https://github.com/twbs/bootstrap/tree/v4-dev/js/dist
import 'bootstrap';

// import local dependencies
import Router from './util/Router';
import common from './routes/common';
// import home from './routes/home';
// import aboutUs from './routes/about';

/** Populate Router instance with DOM routes */
const routes = new Router({
  // All pages
  common
  // Home page
  // home,
  // About Us page, note the change from about-us to aboutUs.
  // aboutUs,
});

// Load Events
jQuery(document).ready(() => routes.loadEvents());
