// @ts-expect-error
import jazzicon from '@metamask/jazzicon';
import { createHash } from 'crypto';

export function bubbleSortObject(arr: any[], key: string | number) {
  for (let i = 0; i < arr.length; i++) {
    // Last i elements are already in place
    for (let j = 0; j < arr.length - i - 1; j++) {
      // Checking if the item at present iteration
      // is greater than the next iteration
      if (arr[j][key] > arr[j + 1][key]) {
        // If the condition is true
        // then swap them
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }

  return arr;
}

export function copyStringToClipboard(input: string) {
  const el = document.createElement('textarea');
  el.value = input;
  el.setAttribute('readonly', '');
  //@ts-expect-error
  el.style = {
    position: 'absolute',
    left: '-9999px',
  };
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

export function rounder(value: number | string | null | undefined, charLength: number = 6) {
  if (!value) return '-';
  if (value == 0) return '0';
  let splitted = ['', ''];
  console.log('value', value);
  if (typeof value === 'string') {
    if (value.includes('.')) {
      splitted = value.split('.');
    } else if (value.includes(',')) {
      splitted = value.split(',');
    } else {
      splitted = [`${value}`, '0'];
    }
    value = parseFloat(value);
  } else {
    splitted = [`${value}`, '0'];
  }
  console.log('splitted', splitted);
  const wholes = splitted[0];
  const decimas = splitted[1];
  let rez: string | null = null;
  if (value >= 99999999999999) {
    const numLength = splitted[0].length;
    rez = `${splitted[0][0]}.${splitted[0][1]}${splitted[0][2]}x10e${numLength - 1}`;
  } else if (value >= 1000) {
    const suffixes = ['', 'k', 'm', 'b', 't'];
    const suffixNum = Math.floor(('' + splitted[0]).length / 3);
    let shortValue: number | null | string = NaN;
    for (let precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat((suffixNum != 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(precision));
      const dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
      if (dotLessShortValue.length <= 2) {
        break;
      }
    }
    if (shortValue && shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
    rez = shortValue + suffixes[suffixNum];
  } else if (value >= 100) {
    const decilalNumToStay = charLength - 4;
    if (decimas.length > decilalNumToStay) rez = value.toFixed(decilalNumToStay);
    else rez = value.toString();
  } else if (value >= 10) {
    const decilalNumToStay = charLength - 3;
    if (decimas.length > decilalNumToStay) rez = value.toFixed(decilalNumToStay);
    else rez = value.toString();
  } else {
    const decilalNumToStay = charLength - 2;
    if (decimas.length > decilalNumToStay) rez = value.toFixed(decilalNumToStay);
    else rez = value.toString();
  }

  return rez;
}

export function rounder2(value: number | string | null | undefined) {
  if (value == 0) return '0';
  if (!value) return '-';
  if (typeof value === 'string') value = parseInt(value);
  if (value < 1000) return value;

  let rez: string | null = null;
  const suffixes = ['', 'k', 'm', 'b', 't'];
  const suffixNum = Math.floor(('' + value).length / 3);
  let shortValue: number | null | string = NaN;
  for (let precision = 2; precision >= 1; precision--) {
    shortValue = parseFloat((suffixNum != 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(precision));
    const dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
    if (dotLessShortValue.length <= 2) {
      break;
    }
  }
  if (shortValue && shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
  rez = shortValue + suffixes[suffixNum];
  return rez;
}

function unround(value: string) {
  try {
    if (value === '-' || value === '0') return value;
    let multiplier = 1;
    let rez = value;
    if (value?.length > 1 && ['k', 'm', 'b', 't'].includes(value.slice(-1))) {
      const multiplierLetter = value.slice(-1);
      switch (multiplierLetter) {
        case 'k':
          multiplier = 10e3;
          break;
        case 'm':
          multiplier = 10e6;
          break;
        case 'b':
          multiplier = 10e9;
          break;
        case 't':
          multiplier = 10e12;
          break;
      }
      rez = (parseFloat(value.slice(0, value.length - 2)) * multiplier).toString();
    }

    return rez;
  } catch (e) {
    return '';
  }
}

export function toHex(str: string) {
  var result = '';
  for (var i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
}

export function toHexMD5(d: string) {
  return createHash('md5').update(d).digest('hex');
}

export function generateBase64Jazz(input: string) {
  try {
    const jazzSvg = jazzicon(16, parseInt(input.slice(2, 10), 16));
    const html = jazzSvg.children[0].outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const b64 = 'data:image/svg+xml;base64,' + btoa(html);
    return b64;
  } catch (e) {
    console.log('Did not manage to create a jazzicon/', e);
    return null;
  }
}
