const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
var request = require('request');
const XLSX = require('xlsx');
const app = express();
const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Hello World! Praveen Chandu Working on Covid");
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Server any static files
app.use(express.static(path.join(__dirname, 'build')));

app.get('/indiastatewisedata', async (req, res) => {
  try {
    await request('https://covid19proarch.blob.core.windows.net/datasets/State_Actuals_Daywise.xlsx',
      { encoding: null }, async function (error, response, body) {
        var workbook = await XLSX.read(body);
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        await request('https://covid19proarch.blob.core.windows.net/datasets/State%20Code.xlsx',
          { encoding: null }, async function (error, response, body1) {
            var workbook1 = await XLSX.read(body1);
            const wsname1 = workbook1.SheetNames[0];
            const ws1 = workbook1.Sheets[wsname1];
            var stateCode = await GetStateCodeName(XLSX.utils.sheet_to_json(ws1, { header: 1 }));
            var stateWiseData = await ConvertStateData(XLSX.utils.sheet_to_json(ws, { header: 1 }), stateCode);

            var statesData = await TotalOfEachState(Object.assign([], stateWiseData));
            var top5States = await Top5States(Object.assign([], statesData));
            res.json({ StatesData: statesData, top5States: top5States });
          });

      });
  }
  catch (e) {
    res.send(e)
  }
})

app.get('/dailyCumulativecharts', async (req, res) => {
  try {
    await request('https://covid19proarch.blob.core.windows.net/datasets/State_Actuals_Daywise.xlsx',
      { encoding: null }, async function (error, response, body) {
        var workbook = await XLSX.read(body);
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        await request('https://covid19proarch.blob.core.windows.net/datasets/State%20Code.xlsx',
          { encoding: null }, async function (error, response, body1) {
            var workbook1 = await XLSX.read(body1);
            const wsname1 = workbook1.SheetNames[0];
            const ws1 = workbook1.Sheets[wsname1];
            var stateCode = await GetStateCodeName(XLSX.utils.sheet_to_json(ws1, { header: 1 }));
            var stateWiseData = await ConvertStateData(XLSX.utils.sheet_to_json(ws, { header: 1 }), stateCode);

            res.json(await ConvertToDailyCumlativeChart(Object.assign([], stateWiseData)));
          });

      });
  }
  catch (e) {
    res.send(e)
  }
})

app.get('/predectionData/:stateCode', async (req, res) => {
  try {
    await request('https://covid19proarch.blob.core.windows.net/datasets/Prediction_data.xlsx',
      { encoding: null }, async function (error, response, body) {
        var workbook = await XLSX.read(body);
        const wsname = workbook.SheetNames;
        var stateCode = req.params.stateCode
        if (wsname.includes(stateCode)) {
          const ws = workbook.Sheets[stateCode];
          res.json(await ConvertPredectionDataSheet(XLSX.utils.sheet_to_json(ws, { header: 1 })));
        }
        else {
          res.json("Not Found");
        }
      });
  }
  catch (e) {
    res.send(e)
  }
})

app.get('/topDistrictsByStateCode/:stateCode', async function (req, res) {
  try {
    await request('https://covid19proarch.blob.core.windows.net/datasets/india_district_actuals.xlsx',
      { encoding: null }, async function (error, response, body) {
        var workbook = await XLSX.read(body);
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        var stateCode = req.params.stateCode

        var totalOfDistrictWise = await TotalDistictsData(XLSX.utils.sheet_to_json(ws, { header: 1 }), stateCode);
        var top5Districts = await Top5Districts(Object.assign([], totalOfDistrictWise))
        if (top5Districts.length > 0) {
          res.json(top5Districts)
        }
        else {
          res.json("Not Found");
        }

      });
  }
  catch (e) {
    res.send(e)
  }
});

app.get('/hospitalData/:code', async function (req, res) {
  try{
  await request('https://covid19proarch.blob.core.windows.net/datasets/India_Others_Details.xlsx',
    { encoding: null }, async function (error, response, body) {
      var workbook = await XLSX.read(body);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      var data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      var code = req.params.code;
      if (data[0].includes(code)) {
        res.json(await ConvertHospitalData(XLSX.utils.sheet_to_json(ws, { header: 1 }), code));

      }
      else {
        res.json("Not Found");
      }
    });
  }
  catch(e)
  {
    res.send(e)
  }
});

app.post('/hotspotDistance', async function (req, res) {
  try{
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  await request('https://covid19proarch.blob.core.windows.net/datasets/Telangana%20LatLong.xlsx',
    { encoding: null }, async function (error, response, body) {
      var workbook = await XLSX.read(body);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      var data = await ConvertHotSpotData(XLSX.utils.sheet_to_json(ws, { header: 1 }));
      var hotspotWithDistance = [];
      await data.forEach(ele => {
        var d = getDistanceFromLatLonInKm(latitude, longitude, ele.Latitude, ele.Longitude);
        hotspotWithDistance.push({
          data: ele,
          distance: d
        })
      });
      var result = await GetSortestDistance(Object.assign([], hotspotWithDistance))
      var outData = { data: result[0].data, distance: Math.round((result[0].distance + Number.EPSILON) * 100) / 100 }
      res.json(outData);
    });
  }
  catch(e)
  {
    res.send(e)
  }
});

async function GetSortestDistance(data) {
  await data.sort(function (a, b) {
    return a.distance - b.distance;
  });
  return data.slice(0, 1);
}
async function ConvertHotSpotData(data) {
  var hotspotData = [];
  await data.forEach(ele => {
    if (ele[0] != null && ele[0] != "S.No") {
      hotspotData.push({
        area: ele[1],
        city_district: ele[2],
        State: ele[3],
        fullAddress: ele[4],
        Latitude: ele[5],
        Longitude: ele[6]

      });
    }
  })
  return hotspotData;
}
//Haversine formula(it is straight line distance)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

async function ConvertHospitalData(data, code) {
  var index = data[0].indexOf(code);
  var tableData = [];

  for (var j = 1; j < data.length; j++) {
    if (data[j][0] != null) {
      tableData.push({ name: data[j][0], count: await NullObjects(data[j][index]) })
    }
  }
  return { code: data[0][index], data: tableData };

}

async function Top5Districts(data) {
  await data.sort(function (a, b) {
    return b.confirmedCount - a.confirmedCount;
  });
  return data;
}

async function TotalDistictsData(data, stateCode) {

  var data2 = [];
  await data.forEach(ele => {
    if (ele[1] == stateCode) {
      data2.push({
        name: ele[2],
        confirmedCount: ele[3],
        activeCount: ele[4],
        recoveredCount: ele[5],
        deceasedCount: ele[6]
      })
    }

  });




  return data2;
}

async function ConvertPredectionDataSheet(data) {
  var p1Series = [];
  var p2Series = [];
  var p3Series = [];
  var s1Series = [];
  var s2Series = [];
  var s3Series = [];
  var h1Series = [];
  var h2Series = [];
  var h3Series = [];
  await data.forEach(element => {
    if (element[0] != "Country" && element[0] != "State" && element[0] != null) {
      var date = new Date(1899, 12, element[2] - 1).toLocaleDateString();
      p1Series.push({
        "name": date,
        "value": NullObjects(element[3])
      });
      p2Series.push({
        "name": date,
        "value": NullObjects(element[4])
      });
      p3Series.push({
        "name": date,
        "value": NullObjects(element[5])
      });

      s1Series.push({
        "name": date,
        "value": NullObjects(element[6])
      });
      s2Series.push({
        "name": date,
        "value": NullObjects(element[7])
      });
      s3Series.push({
        "name": date,
        "value": NullObjects(element[8])
      });

      h1Series.push({
        "name": date,
        "value": NullObjects(element[9])
      });
      h2Series.push({
        "name": date,
        "value": NullObjects(element[10])
      });
      h3Series.push({
        "name": date,
        "value": NullObjects(element[11])
      });

    }
  });
  return {
    name: data[1][0],
    code: data[1][1],
    series1: [{ "name": "Asymptomatic", "series": p1Series }, { "name": "Symptomatic", "series": s1Series }],
    series2: [{ "name": "Asymptomatic", "series": p2Series }, { "name": "Symptomatic", "series": s2Series }],
    series3: [{ "name": "Asymptomatic", "series": p3Series }, { "name": "Symptomatic", "series": s3Series }],
    hospitalSeries: [[{ "name": "H1", "series": h1Series }],
    [{ "name": "H2", "series": h2Series }],
    [{ "name": "H3", "series": h3Series }]]
  }
}

async function GetStateCodeName(data) {
  var stateCodes = [];
  await data.forEach(ele => {
    if (ele[0] != "State" && ele[0] != null) {
      stateCodes.push({ name: ele[0], code: ele[1] });
    }
  })
  return stateCodes;
}

async function ConvertToDailyCumlativeChart(data) {
  var chartData = [];
  await data.forEach(element => {
    var cumlativeConfirmed = 0, cumlativeRecovered = 0, cumlativeDeceased = 0;
    var dailyConfirmedCasesSeries = [],
      dailyRecoveredCasesSeries = [],
      dailyDeceasedCasesSeries = [],
      cumlativeConfirmedCasesSeries = [],
      cumlativeRecoveredCasesSeries = [],
      cumlativeDeceasedCasesSeries = [];

    element.data.forEach(ele => {
      cumlativeConfirmed += ele.confirmed;
      cumlativeRecovered += ele.recovered;
      cumlativeDeceased += ele.deceased;
      dailyConfirmedCasesSeries.push({
        "name": ele.date,
        "value": ele.confirmed
      })
      dailyRecoveredCasesSeries.push({
        "name": ele.date,
        "value": ele.recovered
      })
      dailyDeceasedCasesSeries.push({
        "name": ele.date,
        "value": ele.deceased
      })
      cumlativeConfirmedCasesSeries.push({
        "name": ele.date,
        "value": cumlativeConfirmed
      })
      cumlativeRecoveredCasesSeries.push({
        "name": ele.date,
        "value": cumlativeRecovered
      })
      cumlativeDeceasedCasesSeries.push({
        "name": ele.date,
        "value": cumlativeDeceased
      })
    })
    chartData.push({
      stateCode: element.stateCode,
      daily: [
        [{ "name": "Confirmed cases", "series": dailyConfirmedCasesSeries }],
        [{ "name": "Recovered cases", "series": dailyRecoveredCasesSeries }],
        [{ "name": "Deceased cases", "series": dailyDeceasedCasesSeries }],
      ],
      cumulative: [
        [{ "name": "Confirmed cases", "series": cumlativeConfirmedCasesSeries }],
        [{ "name": "Recovered cases", "series": cumlativeRecoveredCasesSeries }],
        [{ "name": "Deceased cases", "series": cumlativeDeceasedCasesSeries }]
      ],
    })
  })
  return chartData;

}


async function Top5States(data) {
  data.splice(0, 1);
  await data.sort(function (a, b) {
    return b.confirmedCount - a.confirmedCount;
  });
  return data.slice(0, 5);
}

async function TotalOfEachState(stateWiseData) {
  var data = [];
  Array.prototype.sum = function (prop) {
    var total = 0
    for (var i = 0, _len = this.length; i < _len; i++) {
      total += this[i][prop]
    }
    return total
  }
  await stateWiseData.forEach(element => {
    var confirmedCount = element.data.sum('confirmed');
    var recoveredCount = element.data.sum('recovered');
    var deceasedCount = element.data.sum('deceased');
    data.push(
      {
        name: element.name,
        stateCode: element.stateCode,
        confirmedCount: confirmedCount,
        activeCount: (confirmedCount - recoveredCount - deceasedCount),
        recoveredCount: recoveredCount,
        deceasedCount: deceasedCount
      });
  });
  return data;
}

async function ConvertStateData(data, stateCode) {
  var stateCodes = data[0];
  var stateWiseData = [];

  for (var i = 2; i < stateCodes.length; i++) {
    var data2 = [];
    for (var j = 1; j < data.length;) {
      data2.push({
        date: await new Date(1899, 12, data[j][0] - 1).toLocaleDateString(),
        confirmed: await NullObjects(data[j][i]),
        recovered: await NullObjects(data[j + 1][i]),
        deceased: await NullObjects(data[j + 2][i])
      });
      j = j + 3;
    }
    await stateCode.forEach(ele => {
      if (ele.code == stateCodes[i]) {
        stateWiseData.push({ name: ele.name, stateCode: stateCodes[i], data: data2 });
      }
    });
  }
  return stateWiseData;
}

function NullObjects(data) {
  if (data == null) {
    return 0
  }
  return data
}

app.get('/', (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello World! Praveen Chandu Working on Covid");
});




const port = process.env.PORT || 1337;
app.listen(port);

console.log("Server running at http://localhost:%d", port);
