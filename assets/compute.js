// function datediff(first, second) {
//     return Math.round((second - first) / (1000 * 60 * 60 * 24));
// }

function daysBetween(firstDate, secondDate) {
  var diff = Math.floor((secondDate - firstDate) / (24 * 60 * 60 * 1000));
  return diff;
}

export function getArrays(ilrStartValue, leaveStartValues, leaveEndValues) {
  ilrStartDate = new Date(ilrStartValue);
  ilrEndDate = new Date(ilrStartValue);
  ilrEndDate.setFullYear(ilrEndDate.getFullYear() + 5); // add 5 years
  ilrEndDate.setDate(ilrEndDate.getDate() - 1); // minus 1 day

  const windowSize = daysBetween(ilrStartDate, ilrEndDate);
  console.log(`ilrStart is ${ilrStart}`);
  console.log(`ilrStartValue is ${ilrStartValue}`);
  console.log(`ilrStartDate is ${ilrStartDate}`);
  console.log(`ilrEndDate is ${ilrEndDate}`);
  console.log(`windowSize is ${windowSize}`);
  inUK = Array(windowSize).fill(1);
  isFeb29 = Array(windowSize).fill(false);

  // create isFeb29 array to handle leap years
  var irlStartYear = Number(ilrStartDate.getFullYear());
  for (let y = Number(irlStartYear); y < irlStartYear + 5; y++) {
    if (
      y % 4 == 0 &&
      new Date(`${y}-02-29`) >= ilrStartDate &&
      new Date(`${y}-02-29`) < ilrEndDate
    ) {
      var distanceFeb29 = daysBetween(ilrStartDate, new Date(`${y}-02-29`));
      isFeb29[distanceFeb29] = true;
      console.log(
        `in year ${y}, marked index ${distanceFeb29} as true in isFeb29`
      );
    } else {
      console.log(`in year ${y}, did not mark any dates as true in isFeb29`);
    }
  }

  function boundSlicer(slicer, inUK) {
    const lowerBound = 0;
    const upperBound = inUK.length;

    if (slicer < lowerBound) {
      return lowerBound;
    } else if (slicer > upperBound) {
      return upperBound;
    } else {
      return slicer;
    }
  }

  function markLeave(start, end, inUK) {
    start = boundSlicer(start, inUK);
    end = boundSlicer(end, inUK);
    for (let i = start; i < end; i++) {
      // right exclusive as needed for slicers
      inUK[i] = 0;
    }
    console.log(`Marking leave from ${start} to ${end}. Successful?`);
    console.log(
      inUK[start - 1] == 1,
      inUK[start] == 0,
      inUK[end - 1] == 0,
      inUK[end] == 1
    );
  }

  for (var leaveStartValue of leaveStartValues) {
    console.log(`leaveStartValue received as ${leaveStartValue}`);
  }

  for (var leaveEndValue of leaveEndValues) {
    console.log(`leaveEndValue received as ${leaveEndValue}`);
  }

  var zippedValues = leaveStartValues.map(function (entry, i) {
    return [entry, leaveEndValues[i]];
  });

  for (let zippedValue of zippedValues) {
    var distanceStart = daysBetween(ilrStartDate, new Date(zippedValue[0])); // zippedValue[0] corresponds to leaveStart
    var distanceEnd = daysBetween(ilrStartDate, new Date(zippedValue[1])) + 1; // zippedValue[1] corresponds to leaveEnd, +1 for right inclusive
    markLeave(distanceStart, distanceEnd, inUK);
  }
  return [inUK, isFeb29];
}

export function validILR(inUK, isFeb29, projection) {
  // if Feb29 in window, then windowSize=366
  // if Feb29 not in window, then windowSize=365
  // maxAbroad=180

  //initialize window, counter, firstInvalid, projectionIndex
  abroadCounter = 0;
  isValid = true;
  firstInvalid = null;
  lastInvalid = null;
  earliestRestart = null;

  var projectionIndex;
  if (projectionValue != "") {
    projectionDate = new Date(projection.value);
    projectionIndex = daysBetween(ilrStartDate, projectionDate);
    console.log(`projectionIndex is ${projectionIndex}`);
  };

  
  // l, r slicers
  var l = 0;
  var rDate = new Date(ilrStartValue);
  rDate.setFullYear(rDate.getFullYear() + 1); // add 1 year
  rDate.setDate(rDate.getDate() - 1); // minus 1 day
  var r = daysBetween(ilrStartDate, rDate) + 1; // +1 since slicer

  for (var i = 0; i < r; i++) {
    if (inUK[i] == 0) {
      abroadCounter += 1;
    }
    if (abroadCounter>180) {
      if (isValid) {  // execute once only
        isValid = false
      }
      if (firstInvalid) {
        firstInvalid = 0;
      }
      lastInvalid = 0;
      earliestRestart = 0; 
    }
  }

  if (projectionValue!="" && projectionIndex<r-1) {
    remainingAbsences = 180
    for (i=0; i<projectionIndex; i++) {
      if (inUK[i]==0) {
        remainingAbsences = Math.max(0, remainingAbsences-1)
      }
    }
    
  }
  
  // console.log(`i, projectionIndex are ${i}, ${projectionIndex} and do they match? ${i==projectionIndex}`)

  console.log(`l initialized as ${l}`);
  console.log(`r initialized as ${r}`);
  console.log(`abroadCounter initialized as ${abroadCounter}`);

  // sliding window
  function increment_l(l, abroadCounter, lastInvalid) {
    l += 1;
    if (inUK[l - 1] == 0) {
      // -1 because we want to look at previous pointer
      abroadCounter -= 1;
    }
    return [l, abroadCounter];
  }

  function increment_r(r, abroadCounter) {
    r += 1;
    if (inUK[r - 1] == 0) {
      // -1 to convert right slicer to right pointer
      abroadCounter += 1;
    }
    return [r, abroadCounter];
  }

  // at each step: check counter and slide window
  while (r < inUK.length) {
    if (projectionValue != "") {
      if (r-1 == projectionIndex) {  // convert slicer to index, so -1
        remainingAbsences = Math.max(0, 180-abroadCounter);
      }
    }

    if (abroadCounter > 180) {
      // check abroadCounter to update the 2 invalid dates
      isValid = false;
      if (firstInvalid == null) {  // updated once only
        firstInvalid = r-1;  // -1 to convert slicer to index
      }
      lastInvalid = r-1;  // -1 to convert slicer to index
      earliestRestart = l;
    }

    if (isFeb29[l]) {
      [l, abroadCounter] = increment_l(l, abroadCounter);
    }
    if (isFeb29[r]) {
      [r, abroadCounter] = increment_r(r, abroadCounter);
    }

    [l, abroadCounter] = increment_l(l, abroadCounter);
    [r, abroadCounter] = increment_r(r, abroadCounter);
  }

  if (lastInvalid != null) {
    lastInvalidDate = new Date(ilrStartValue);
    lastInvalidDate.setDate(
      lastInvalidDate.getDate() + lastInvalid
    ); // plus lastInvalid days
    
    console.log(`lastInvalidDate is ${lastInvalidDate}`)
  }

  if (earliestRestart!==null) {
    earliestRestart += 1  //+1 since the last window is invalid, but the very next is valid
    earliestRestartDate = new Date(ilrStartValue);
    earliestRestartDate.setDate(earliestRestartDate.getDate() + earliestRestart) 
  } else {
    earliestRestartDate = null
  }

  console.log(`finally, l is ${l}`);
  console.log(`finally, r is ${r}`);
  console.log(`finally, remainingAbsences is ${remainingAbsences}`);
  console.log(`finally, earliestRestart is ${earliestRestart}`);

  return [isValid, firstInvalid, earliestRestartDate, remainingAbsences];
}
