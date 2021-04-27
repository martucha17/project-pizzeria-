import { select } from '../settings.js';
class Home {
  constructor() {
    const thisHome = this;

    thisHome.initActions();
  }

  initActions() {
    const thisHome = this;

    thisHome.goOrder = document.querySelector(select.home.goOrder);
    console.log(thisHome.goOrder);
    thisHome.goBooking = document.querySelector(select.home.goBooking);
    thisHome.orderLink = document.querySelector(select.nav.orderLink);
    console.log(thisHome.orderLink);
    thisHome.homeLink = document.querySelector(select.nav.homeLink);




    thisHome.goOrder.addEventListener('click', function (event) {
      event.preventDefault();
      thisHome.homeLink.classList.remove('active');
      thisHome.orderLink.classList.add('active');
      window.location = 'http://localhost:3000/#/order';
    });

    thisHome.goBooking.addEventListener('click', function (event) {
      event.preventDefault();
      thisHome.homeLink.classList.remove('active');
      thisHome.bookingLink.classList.add('active');
      window.location = 'http://localhost:3000/#/home';
    });


  }


}
export default Home;