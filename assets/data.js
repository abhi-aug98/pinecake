// Mock inventory. price:null => "Call for price" (listing_viewed must omit price).
window.LISTINGS = [
  { id: 'L-1001', type: 'rv',   make: 'Winnebago', model: 'Minnie Winnie 31K', year: 2021, price: 74900, condition: 'Used', city: 'Dayton', state: 'OH', phone: '(937) 555-0101', mileage: 18200 },
  { id: 'L-1002', type: 'rv',   make: 'Jayco',     model: 'Jay Flight 264BH',  year: 2023, price: 31995, condition: 'New',  city: 'Columbus', state: 'OH', phone: '(614) 555-0102', mileage: 0 },
  { id: 'L-1003', type: 'rv',   make: 'Thor',      model: 'Four Winds 24F',    year: 2019, price: null,  condition: 'Used', city: 'Springfield', state: 'OH', phone: '(937) 555-0103', mileage: 32100 },
  { id: 'L-1004', type: 'rv',   make: 'Airstream', model: 'Bambi 22FB',        year: 2022, price: 68500, condition: 'Used', city: 'Cincinnati', state: 'OH', phone: '(513) 555-0104', mileage: 0 },
  { id: 'L-1005', type: 'rv',   make: 'Forest River', model: 'Rockwood 2514S', year: 2020, price: 27250, condition: 'Used', city: 'Xenia', state: 'OH', phone: '(937) 555-0105', mileage: 0 },
  { id: 'L-1006', type: 'rv',   make: 'Winnebago', model: 'Vista 29V',         year: 2024, price: 119000, condition: 'New', city: 'Toledo', state: 'OH', phone: '(419) 555-0106', mileage: 0 },
  { id: 'L-2001', type: 'boat', make: 'Bennington', model: '22 SSBX Pontoon',  year: 2022, price: 56800, condition: 'Used', city: 'Lake Erie', state: 'OH', phone: '(440) 555-0201', mileage: 0 },
  { id: 'L-2002', type: 'boat', make: 'Sea Ray',   model: 'SPX 210',           year: 2018, price: 38900, condition: 'Used', city: 'Sandusky', state: 'OH', phone: '(419) 555-0202', mileage: 0 },
  { id: 'L-2003', type: 'boat', make: 'Tracker',   model: 'Pro Team 175 TXW',  year: 2023, price: 24995, condition: 'New',  city: 'Springfield', state: 'OH', phone: '(937) 555-0203', mileage: 0 },
  { id: 'L-2004', type: 'boat', make: 'Yamaha',    model: '212X Jet Boat',     year: 2021, price: null,  condition: 'Used', city: 'Dayton', state: 'OH', phone: '(937) 555-0204', mileage: 0 },
  { id: 'L-2005', type: 'boat', make: 'Bennington', model: '20 SLV Pontoon',   year: 2020, price: 33400, condition: 'Used', city: 'Hebron', state: 'OH', phone: '(740) 555-0205', mileage: 0 },
  { id: 'L-2006', type: 'boat', make: 'Chaparral', model: '257 SSX',           year: 2019, price: 61500, condition: 'Used', city: 'Port Clinton', state: 'OH', phone: '(419) 555-0206', mileage: 0 }
];

// Shared search logic (used by site.js to prefill trk, and by pages.js to render)
window.searchListings = function (p) {
  var q = (p.q || '').toLowerCase(), type = p.type || '', make = p.make || '', max = +p.max || 0, sort = p.sort || 'relevance';
  var res = window.LISTINGS.filter(function (l) {
    var t = (l.year + ' ' + l.make + ' ' + l.model + ' ' + l.type).toLowerCase();
    return (!q || t.indexOf(q) > -1) && (!type || l.type === type) && (!make || l.make === make) && (!max || (l.price !== null && l.price <= max));
  });
  if (sort === 'price_asc') res.sort(function (a, b) { return (a.price || 1e9) - (b.price || 1e9); });
  if (sort === 'price_desc') res.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
  if (sort === 'year_desc') res.sort(function (a, b) { return b.year - a.year; });
  return res;
};
