import { templates, select, settings, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
/* global utils */


class Booking {
  constructor(wrapper) {
    const thisBooking = this;

    thisBooking.selectedTable = null;

    thisBooking.render(wrapper);
    thisBooking.initWidget();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    console.log('getData params', params);



    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };
    console.log('getData urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        console.log(bookings);
        console.log(eventsCurrent);
        console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      // console.log('loop', hourBlock);

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
      
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.selectedTable = null;
    const activeTable = thisBooking.dom.floorPlan.querySelector(select.booking.activeTable);
    if (activeTable) activeTable.classList.remove(classNames.booking.tableSelected);

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  pickTable(table) {
    const thisBooking = this;

    if (table.classList.contains(classNames.booking.tableBooked)) {
      alert('This table is already taken');
    } else {
      const activeTable = thisBooking.dom.floorPlan.querySelector(select.booking.activeTable);
      if (activeTable && activeTable !== table) activeTable.classList.remove(classNames.booking.tableSelected);

      if (table.classList.contains(classNames.booking.tableSelected)) {
        table.classList.remove(classNames.booking.tableSelected);
        thisBooking.selectedTable = null;
      } else {
        table.classList.add(classNames.booking.tableSelected);
        thisBooking.selectedTable = table.getAttribute('data-table');
      }
    }
  }

  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.dom.dateInput.value,
      hour: utils.numberToHour(thisBooking.dom.hourInput.value),
      table: thisBooking.selectedTable,
      duration: thisBooking.dom.durationInput.value,
      ppl: thisBooking.dom.peopleAmountInput.value,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
      starters: []
    };
    for (const starter of thisBooking.dom.starters) {
      if (starter.checked) payload.starters.push(starter.value);
    }

    console.log(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {
        console.log('parsedresponse', parsedResponse);
      });

    thisBooking.makeBooked();

  }



  render(wrapper) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = wrapper;

    wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
    thisBooking.dom.activeTable = thisBooking.dom.wrapper.querySelector(select.booking.activeTable);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.dateInput = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisBooking.dom.hourInput = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    thisBooking.dom.peopleAmountInput = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmountInput);
    thisBooking.dom.durationInput = thisBooking.dom.wrapper.querySelector(select.booking.durationInput);




  }

  initWidget() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.peopleAmount.addEventListener('click', function (event) {
      event.preventDefault();
    });

    thisBooking.dom.hoursAmount.addEventListener('click', function (event) {
      event.preventDefault();
    });

    thisBooking.dom.datePicker.addEventListener('click', function (event) {
      event.preventDefault();
    });

    thisBooking.dom.hourPicker.addEventListener('click', function (event) {
      event.preventDefault();
    });

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function (event) {
      event.preventDefault();
      if (event.target.classList.contains(classNames.booking.table)) {
        thisBooking.pickTable(event.target);
      }
    });

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });




  }



}


export default Booking;