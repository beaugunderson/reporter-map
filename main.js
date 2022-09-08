import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import mqtt from 'mqtt';
import { locatorToLatLng } from 'qth-locator';
import * as turf from '@turf/turf';

import './style.css';

// TODO add dropdown for selecting a tileset
// 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

// TODO add filtering based on callsign, grid square, etc.

// TODO add kernel density map to estimate propagation?

const map = L.map('map').setView([0, 0], 3);

L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 19,
  noWrap: true,
}).addTo(map);

// transform a spot from MQTT to an object with long attribute names merely to
// make the code more readable
function transform(packet) {
  return {
    sequenceNumber: packet.sq,
    frequency: packet.f,
    mode: packet.md,
    snr: packet.rp,
    timestamp: packet.t,
    callSender: packet.sc,
    callReceiver: packet.rc,
    locatorSender: packet.sl,
    locatorReceiver: packet.rl,
    countrySender: packet.sa,
    countryReceiver: packet.ra,
    band: packet.b,
  };
}

const BANDS = [
  '70cm',
  '2m',
  '6m',
  '10m',
  '12m',
  '15m',
  '17m',
  '20m',
  '30m',
  '40m',
  '60m',
  '80m',
  '160m',
];

// from http://vrl.cs.brown.edu/color; could make this a gradient instead?
const BAND_COLORS = [
  'rgb(1,196,114)',
  'rgb(226,105,138)',
  'rgb(236,130,46)',
  'rgb(149,73,182)',
  'rgb(137,149,118)',
  'rgb(54,109,165)',
  'rgb(214,6,26)',
  'rgb(43,25,217)',
  'rgb(174,227,154)',
  'rgb(252,209,7)',
  'rgb(84,178,252)',
  'rgb(233,210,156)',
  'rgb(44,92,57)',
];

const MQTT_ADDRESS = 'wss://mqtt.pskreporter.info:1886';

console.log(`Connecting to ${MQTT_ADDRESS}`);
const client = mqtt.connect(MQTT_ADDRESS);

client.on('connect', () => {
  client.subscribe('pskr/filter/v2/+/FT8/#', (err) => {
    if (err) {
      console.error(`Error subscribing: ${err.message}`);
    } else {
      console.log('Subscribed.');
    }
  });
});

client.on('error', (err) => console.error(err));

client.on('message', (_, message) => {
  const report = transform(JSON.parse(message.toString()));

  const [senderLat, senderLon] = locatorToLatLng(report.locatorSender);
  const [receiverLat, receiverLon] = locatorToLatLng(report.locatorReceiver);

  const senderPoint = turf.point([senderLon, senderLat]);
  const receiverPoint = turf.point([receiverLon, receiverLat]);

  const arc = turf.greatCircle(senderPoint, receiverPoint);

  const index = BANDS.indexOf(report.band);

  if (index === -1) {
    console.log('Band without corresponding color:', report.band);
  }

  // sometimes we get nonsensical paths, e.g. when the sende/receiver grids are the same
  if (arc.geometry.coordinates.some(([a, b]) => Number.isNaN(a) || Number.isNaN(b))) {
    return;
  }

  L.geoJSON(arc)
    .setStyle({ color: BAND_COLORS[index] ?? 'black', opacity: 0.75, weight: 1 })
    .addTo(map);
});
