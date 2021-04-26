class Home {
  constructor() {
    const thisHome = this;

    thisHome.initActions();
  }

  initActions() {
    const thisHome = this;

    thisHome.goOrder = document.querySelector('.go-order');
    console.log(thisHome.goOrder);
    thisHome.orderLink = document.querySelector('.order-link');
    console.log(thisHome.orderLink);
    



    thisHome.goOrder.addEventListener('click', function (event) {
      event.preventDefault();
      thisHome.orderLink.classList.add('.active');
      window.location= "http://localhost:3000/#/order";
    });


  }


}
export default Home;