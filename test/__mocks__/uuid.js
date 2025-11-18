import { randomBytes } from 'crypto';

function v4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (randomBytes(1)[0] & (15 >> (c / 4)))).toString(16),
  );
}

function v7() {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const randomHex = randomBytes(10).toString('hex').slice(0, 20);
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${randomHex.slice(0, 3)}-${randomHex.slice(3, 7)}-${randomHex.slice(7, 19)}`;
}

function v1() {
  return v4();
}
function v3() {
  return v4();
}
function v5() {
  return v4();
}
function v6() {
  return v4();
}
function v8() {
  return v4();
}

const NIL = '00000000-0000-0000-0000-000000000000';

function parse(uuid) {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

function stringify(buffer) {
  const hex = buffer.toString('hex');
  return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
}

function validate(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

function version(uuid) {
  return parseInt(uuid[14]);
}

export default {
  v1,
  v3,
  v4,
  v5,
  v6,
  v7,
  v8,
  NIL,
  parse,
  stringify,
  validate,
  version,
};
