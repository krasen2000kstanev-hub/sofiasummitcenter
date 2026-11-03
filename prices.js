// Price calculator for /tseni/. Prices live in the page's tables (data-price), so the tables and the calculator cannot disagree.
(function () {
  // Empty price means "on request": it is never counted as 0.
  function toPrice(value) {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    var price = Number(value);
    return Number.isFinite(price) && price >= 0 ? price : null;
  }

  // A count the visitor may leave at zero, unlike hours or guests.
  function countOrZero(value) {
    return Math.max(0, Math.floor(Number(value)) || 0);
  }

  function wholeNumber(value, max) {
    return Math.min(max, Math.max(1, Math.floor(Number(value)) || 1));
  }

  // The price list has two bands; longer rentals are quoted individually.
  function durationBand(hours) {
    if (hours <= 4) return 'up4';
    return hours <= 8 ? 'up8' : null;
  }

  function guestBand(guests) {
    return guests > 100 ? 'large' : 'small';
  }

  function extraPrice(priceUp4, priceUp8, perHourOver4, hours) {
    var band = durationBand(hours);
    if (!band || priceUp4 === null || priceUp8 === null) return null;
    return band === 'up4' ? priceUp4 : priceUp8 + (perHourOver4 || 0) * (hours - 4);
  }

  // Each reel costs less in a bigger order: the band for the whole count sets the price per reel.
  function reelsTotal(count, tiers) {
    if (count <= 0) return 0;
    var tier = tiers.filter(function (t) { return count <= t.max; }).sort(function (a, b) { return a.max - b.max; })[0];
    return tier ? tier.price * count : null;
  }

  function calculateQuote(roomPrice, extras) {
    var pending = extras.filter(function (extra) { return extra.price === null; }).map(function (extra) { return extra.label; });
    var extrasTotal = extras.reduce(function (sum, extra) { return sum + (extra.price || 0); }, 0);
    return { total: roomPrice === null ? null : roomPrice + extrasTotal, pending: pending };
  }

  if (typeof module !== 'undefined') module.exports = { toPrice: toPrice, wholeNumber: wholeNumber, countOrZero: countOrZero, durationBand: durationBand, guestBand: guestBand, extraPrice: extraPrice, reelsTotal: reelsTotal, calculateQuote: calculateQuote };
  if (typeof document === 'undefined') return;

  var form = document.getElementById('price-calculator');
  if (!form) return;
  var en = document.documentElement.lang === 'en';
  var t = en ? {
    locale: 'en-GB', vat: ' excl. VAT', onRequest: 'on request', choose: 'Choose a service', request: 'On request', notIncluded: 'Not included in the total: ',
    recordingsLabel: 'Recordings up to 60 minutes, €120 each', hoursLabel: 'Number of hours', recording: 'Recording up to 60 minutes: ', hours: ' h', guests: ' guests',
    interested: 'I am interested in: ', recordings: 'recordings up to 60 minutes: ', noRecording: 'no recording up to 60 minutes.', extras: ' Extras: ', estimate: ' Estimated price: ',
    reels: 'Reels: ', agreed: 'by agreement', contact: '/en/contact/', inquiry: '#inquiry'
  } : {
    locale: 'bg-BG', vat: ' без ДДС', onRequest: 'по запитване', choose: 'Изберете услуга', request: 'По запитване', notIncluded: 'Не е включено в сумата: ',
    recordingsLabel: 'Записи до 60 минути, по 120 €', hoursLabel: 'Брой часове', recording: 'Запис до 60 минути: ', hours: ' ч.', guests: ' гости',
    interested: 'Интересувам се от: ', recordings: 'брой записи до 60 минути: ', noRecording: 'без запис до 60 минути.', extras: ' Допълнително: ', estimate: ' Ориентировъчна цена: ',
    reels: 'Рийлове: ', agreed: 'по договаряне', contact: '/kontakti/', inquiry: '#zapitvane'
  };
  var totalBox = document.getElementById('calc-total');
  var itemsBox = document.getElementById('calc-items');
  var noteBox = document.getElementById('calc-note');
  var cta = document.getElementById('calc-cta');
  var guestsField = document.getElementById('calc-guests-field');
  var dayField = document.getElementById('calc-day-field');
  var extrasField = document.getElementById('calc-extras-field');
  var studioExtrasField = document.getElementById('calc-studio-extras-field');
  var hoursLabel = document.getElementById('calc-hours-label');
  var longRecordingField = document.getElementById('calc-recording120-field');
  var hoursField = document.getElementById('calc-hours-field');
  var rubricField = document.getElementById('calc-rubric-field');
  var wasStudio = false;

  function selectedText(select) { return select.options[select.selectedIndex].text; }
  function formatAmount(price) {
    var amount = price.toLocaleString(t.locale, { maximumFractionDigits: 2 });
    return en ? '€' + amount : amount + ' €';
  }
  function formatPrice(price) { return formatAmount(price) + t.vat; }

  function onRequestText(box) { return box.dataset.onRequest || t.onRequest; }

  // Shows what each option costs right next to it, for the current hours or recordings.
  function setHint(box, price, onRequest) {
    var hint = box.parentNode.querySelector('.calc-hint');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'calc-hint';
      box.parentNode.appendChild(hint);
    }
    hint.textContent = price === null ? onRequest || onRequestText(box) : formatAmount(price);
  }

  function renderItems(items) {
    itemsBox.textContent = '';
    items.forEach(function (item) {
      var row = document.createElement('li');
      var label = document.createElement('span');
      var amount = document.createElement('b');
      label.textContent = item.label;
      amount.textContent = item.price === null ? (item.onRequest || t.onRequest) : formatAmount(item.price);
      row.appendChild(label);
      row.appendChild(amount);
      itemsBox.appendChild(row);
    });
  }

  function readRoomPrice(room, day, hours, guests) {
    if (room === 'rubric') return 0;
    if (room === 'event-hall') {
      var band = durationBand(hours);
      if (!band) return null;
      return toPrice(document.querySelector('[data-room="event-hall"][data-day="' + day + '"][data-duration="' + band + '"][data-guests="' + guestBand(guests) + '"]').dataset.price);
    }
    var cell = document.querySelector('[data-room="' + room + '"][data-day="' + day + '"]') || document.querySelector('[data-room="' + room + '"][data-day="any"]');
    var hourly = toPrice(cell.dataset.price);
    return hourly === null ? null : hourly * hours;
  }

  function readExtra(box, hours) {
    var row = document.querySelector('[data-extra="' + box.value + '"]').dataset;
    // Some rooms agree this service individually instead of using the listed price.
    if ((box.dataset.negotiableFor || '').split(' ').indexOf(form.space.value) >= 0) return { label: box.dataset.label, onRequest: t.agreed, price: null };
    return { label: box.dataset.label, onRequest: box.dataset.onRequest, price: extraPrice(toPrice(row.priceUp4), toPrice(row.priceUp8), toPrice(row.perHourOver4), hours) };
  }

  function studioExtraPrice(box, recordings) {
    var row = document.querySelector('[data-studio-extra="' + box.value + '"]').dataset;
    var price = toPrice(row.price);
    // Before any recording is chosen, per-recording extras show the price of one.
    return price !== null && 'perRecording' in row ? price * Math.max(1, recordings) : price;
  }

  function readQuantities(selector) {
    var items = [];
    form.querySelectorAll(selector).forEach(function (input) {
      var count = countOrZero(input.value);
      if (!count) return;
      var price = toPrice(document.querySelector('[data-studio-qty-row="' + input.dataset.studioQty + '"]').dataset.price);
      items.push({ label: input.dataset.label + ': ' + count, price: price === null ? null : price * count });
    });
    return items;
  }

  function readStudioExtras(recordings) {
    var extras = Array.prototype.map.call(form.querySelectorAll('input[name=studio-extra]:checked'), function (box) {
      return { label: box.dataset.label, onRequest: box.dataset.onRequest, price: studioExtraPrice(box, recordings) };
    }).concat(readQuantities('#calc-recording120'));
    var reels = countOrZero(form.reels.value);
    if (reels > 0) {
      var tiers = Array.prototype.map.call(document.querySelectorAll('[data-reels-max]'), function (row) {
        return { max: Number(row.dataset.reelsMax), price: toPrice(row.dataset.price) };
      });
      extras.push({ label: t.reels + reels, price: reelsTotal(reels, tiers) });
    }
    return extras;
  }

  function update() {
    var room = form.space.value;
    var isHall = room === 'event-hall';
    guestsField.hidden = !isHall;
    // Extras a room does not offer must not stay selected when switching to it.
    form.querySelectorAll('[data-not-for]').forEach(function (label) {
      var unavailable = label.dataset.notFor.split(' ').indexOf(room) >= 0;
      label.hidden = unavailable;
      if (unavailable) label.querySelector('input').checked = false;
    });
    // The studio is priced per recording, so its quantity field counts recordings, not hours.
    var isStudio = room === 'podcast-studio';
    var isRubric = room === 'rubric';
    if (isStudio !== wasStudio) form.hours.value = isStudio ? 1 : 4;
    wasStudio = isStudio;
    hoursLabel.textContent = isStudio ? t.recordingsLabel : t.hoursLabel;
    dayField.hidden = isStudio || isRubric;
    hoursField.hidden = isRubric;
    rubricField.hidden = !isRubric;
    longRecordingField.hidden = !isStudio;
    extrasField.hidden = isStudio || isRubric;
    studioExtrasField.hidden = !isStudio;
    var hours = isStudio ? countOrZero(form.hours.value) : wholeNumber(form.hours.value, 24);
    var guests = wholeNumber(form.guests.value, 150);
    // Selections from the other kind of space must not reach the total.
    if (isStudio || isRubric) form.querySelectorAll('input[name=extra]').forEach(function (box) { box.checked = false; });
    if (!isStudio) form.querySelectorAll('input[name=studio-extra]').forEach(function (box) { box.checked = false; });
    if (!isRubric) rubricField.querySelectorAll('input').forEach(function (input) { input.value = 0; });
    if (!isStudio) form.querySelectorAll('#calc-studio-extras-field input[type=number], #calc-recording120').forEach(function (input) { input.value = 0; });
    // A script is only sold with its rubric, so there cannot be more scripts than rubrics of that length.
    [['calc-scripts', 'calc-rubric5'], ['calc-scripts10', 'calc-rubric10']].forEach(function (pair) {
      var scripts = document.getElementById(pair[0]);
      var rubrics = countOrZero(document.getElementById(pair[1]).value);
      if (countOrZero(scripts.value) > rubrics) scripts.value = rubrics;
    });
    var recordings = hours + countOrZero(document.getElementById('calc-recording120').value);
    var extras = isRubric ? readQuantities('#calc-rubric-field [data-studio-qty]') : isStudio
      ? readStudioExtras(recordings)
      : Array.prototype.map.call(form.querySelectorAll('input[name=extra]:checked'), function (box) { return readExtra(box, hours); });
    var roomPrice = readRoomPrice(room, form.day.value, hours, guests);
    var quote = calculateQuote(roomPrice, extras);

    form.querySelectorAll('input[name=extra]').forEach(function (box) { var extra = readExtra(box, hours); setHint(box, extra.price, extra.onRequest); });
    form.querySelectorAll('input[name=studio-extra]').forEach(function (box) { setHint(box, studioExtraPrice(box, recordings)); });

    var roomLabel = isStudio ? t.recording + hours : selectedText(form.space) + ', ' + hours + t.hours + (isHall ? ', ' + guests + t.guests : '');
    renderItems((isRubric || (isStudio && !hours) ? [] : [{ label: roomLabel, price: roomPrice }]).concat(extras));

    if (quote.total === 0) totalBox.textContent = t.choose;
    else totalBox.textContent = quote.total === null ? t.request : formatPrice(quote.total);
    noteBox.textContent = quote.pending.length ? t.notIncluded + quote.pending.join(', ') + '.' : '';

    var summary = t.interested + selectedText(form.space) + (isRubric ? '.' : ', ') + (isRubric ? '' : isStudio ? (hours ? t.recordings + hours + '.' : t.noRecording) : selectedText(form.day).toLowerCase() + ', ' + hours + t.hours + '.');
    if (extras.length) summary += (isRubric ? ' ' : t.extras) + extras.map(function (extra) { return extra.label; }).join(', ') + '.';
    if (quote.total) summary += t.estimate + formatPrice(quote.total) + '.';
    // Rubrics are filmed in the studio, so their inquiry books that space.
    cta.href = t.contact + '?space=' + (isRubric ? 'podcast-studio' : room) + (isHall ? '&guests=' + guests : '') + '&message=' + encodeURIComponent(summary) + t.inquiry;
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', function (event) { event.preventDefault(); });
  update();
})();
