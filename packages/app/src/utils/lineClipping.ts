type Point = {
  x: number;
  y: number;
};

const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

const computeOutCode = (x: number, y: number): number => {
  let code = INSIDE;

  if (x < 0) {
    code |= LEFT;
  } else if (x > window.innerWidth) {
    code |= RIGHT;
  }

  if (y < 0) {
    code |= BOTTOM;
  } else if (y > window.innerHeight) {
    code |= TOP;
  }

  return code;
};

export const lineCrossesViewport = (start: Point, end: Point): boolean => {
  let x0 = start.x;
  let y0 = start.y;
  let x1 = end.x;
  let y1 = end.y;

  let outcode0 = computeOutCode(x0, y0);
  let outcode1 = computeOutCode(x1, y1);
  let accept = false;

  while (true) {
    if (!(outcode0 | outcode1)) {
      accept = true;
      break;
    } else if (outcode0 & outcode1) {
      break;
    } else {
      let x, y;
      const outcodeOut = outcode0 ? outcode0 : outcode1;

      if (outcodeOut & TOP) {
        x = x0 + ((x1 - x0) * (window.innerHeight - y0)) / (y1 - y0);
        y = window.innerHeight;
      } else if (outcodeOut & BOTTOM) {
        x = x0 + ((x1 - x0) * -y0) / (y1 - y0);
        y = 0;
      } else if (outcodeOut & RIGHT) {
        y = y0 + ((y1 - y0) * (window.innerWidth - x0)) / (x1 - x0);
        x = window.innerWidth;
      } else {
        y = y0 + ((y1 - y0) * -x0) / (x1 - x0);
        x = 0;
      }

      if (outcodeOut === outcode0) {
        x0 = x;
        y0 = y;
        outcode0 = computeOutCode(x0, y0);
      } else {
        x1 = x;
        y1 = y;
        outcode1 = computeOutCode(x1, y1);
      }
    }
  }

  return accept;
};
