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


app.get('/india-latest', async (req, res) => {
  await request('https://covid19proarch.blob.core.windows.net/datasets/India_Latest.xlsx',
    { encoding: null }, async function (error, response, body) {
      var workbook = await XLSX.read(body);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      res.json(await ConvertLatestData(XLSX.utils.sheet_to_json(ws, { header: 1 })));
    });

})

app.get('/india-predict-data', async (req, res) => {
  await request('https://covid19proarch.blob.core.windows.net/datasets/India_Prediction.xlsx',
    { encoding: null }, async function (error, response, body) {
      var workbook = await XLSX.read(body);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      res.json(await ConvertPredectionData(XLSX.utils.sheet_to_json(ws, { header: 1 })));
    });
})

app.get('/hospitalList', async (req, res) => {
  await request('https://covid19proarch.blob.core.windows.net/datasets/India%20-%20hospital%2C%20testing%20data.xlsx',
    { encoding: null }, async function (error, response, body) {
      var workbook = await XLSX.read(body);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      res.json(await ConvertHospitalTestData(XLSX.utils.sheet_to_json(ws, { header: 1 })));
    });
})

app.get('/india-actual-daywise', async (req, res) => {
  await request('https://covid19proarch.blob.core.windows.net/datasets/Inida_Actuals_Daywise.xlsx',
    { encoding: null }, async function (error, response, body) {
      var workbook = await XLSX.read(body);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      res.json(await ConvertActualDateWiseData(XLSX.utils.sheet_to_json(ws, { header: 1 })));
    });
})

app.get('/india-statewise-data', async (req, res) => {
  await request('https://covid19proarch.blob.core.windows.net/datasets/State_Wise_Actuals.xlsx',
    { encoding: null }, async function (error, response, body) {
      var workbook = await XLSX.read(body);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      res.json(await ConvertStateWiseData(XLSX.utils.sheet_to_json(ws, { header: 1 })));
    });
})

app.get('/indiastatewisedata', async (req, res) => {
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
})

app.get('/dailyCumulativecharts', async (req, res) => {
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
})

app.get('/predectionData/:stateCode', async (req, res) => {
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
})

app.get('/topDistrictsByStateCode/:stateCode', async function (req, res) {
  await request('https://covid19proarch.blob.core.windows.net/datasets/District_Actuals.xlsx',
    { encoding: null }, async function (error, response, body) {
      var workbook = await XLSX.read(body);
      const wsname = workbook.SheetNames;
      var stateCode = req.params.stateCode
      if (wsname.includes(stateCode)) {
        const ws = workbook.Sheets[stateCode];
        var totalOfDistrictWise = await TotalDistictsData(XLSX.utils.sheet_to_json(ws, { header: 1 }));
        var top5Districts = await Top5Districts(Object.assign([], totalOfDistrictWise))
        res.json(top5Districts)
      }
      else {
        res.json("Not Found");
      }

    });
});

app.get('/hospitalData/:code', async function (req, res) {
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
});

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
  return data.slice(0, 5);
}

async function TotalDistictsData(data) {
  var districtNames = data[0];
  var data2 = [];
  for (var i = 2; i < districtNames.length; i++) {
    var confirmedCount = 0;
    var recoveredCount = 0;
    var deceasedCount = 0;
    for (var j = 1; j < data.length;) {

      confirmedCount += await NullObjects(data[j][i]);
      recoveredCount += await NullObjects(data[j + 1][i]);
      deceasedCount += await NullObjects(data[j + 2][i]);

      j = j + 3;
    }
    data2.push({
      name: districtNames[i],
      confirmedCount: confirmedCount,
      activeCount: (confirmedCount - recoveredCount - deceasedCount),
      recoveredCount: recoveredCount,
      deceasedCount: deceasedCount
    })

  }
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
    series1: [{ "name": "P1", "series": p1Series }, { "name": "S1", "series": s1Series }],
    series2: [{ "name": "P2", "series": p2Series }, { "name": "S2", "series": s2Series }],
    series3: [{ "name": "P3", "series": p3Series }, { "name": "S3", "series": s3Series }],
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

async function ConvertLatestData(data) {
  var latestData = [];
  await data.forEach(element => {
    latestData.push({ name: element[0], totalCount: element[1] })
  });
  return latestData;
}

async function ConvertPredectionData(data) {
  var p1Series = [];
  var p2Series = [];
  var p3Series = [];
  var p4Series = [];
  var s1Series = [];
  var s2Series = [];
  var s3Series = [];
  var s4Series = [];
  var h1Series = [];
  var h2Series = [];
  var h3Series = [];
  var h4Series = [];
  await data.forEach(element => {
    if (element[0] != "Country") {
      var date = new Date(1899, 12, element[2] - 1).toLocaleDateString();
      p1Series.push({
        "name": date,
        "value": element[3]
      });
      p2Series.push({
        "name": date,
        "value": element[4]
      });
      p3Series.push({
        "name": date,
        "value": element[5]
      });
      p4Series.push({
        "name": date,
        "value": element[6]
      });
      s1Series.push({
        "name": date,
        "value": element[7]
      });
      s2Series.push({
        "name": date,
        "value": element[8]
      });
      s3Series.push({
        "name": date,
        "value": element[9]
      });
      s4Series.push({
        "name": date,
        "value": element[10]
      });
      h1Series.push({
        "name": date,
        "value": element[11]
      });
      h2Series.push({
        "name": date,
        "value": element[12]
      });
      h3Series.push({
        "name": date,
        "value": element[13]
      });
      h4Series.push({
        "name": date,
        "value": element[14]
      });
    }
  });
  return {
    series1: [{ "name": "P1", "series": p1Series }, { "name": "S1", "series": s1Series }],
    series2: [{ "name": "P2", "series": p2Series }, { "name": "S2", "series": s2Series }],
    series3: [{ "name": "P3", "series": p3Series }, { "name": "S3", "series": s3Series }],
    series4: [{ "name": "P4", "series": p4Series }, { "name": "S4", "series": s4Series }],
    hospitalSeries: [{ "name": "H1", "series": h1Series }, { "name": "H2", "series": h2Series },
    { "name": "H3", "series": h3Series }, { "name": "H4", "series": h4Series }]
  }

}

async function ConvertActualDateWiseData(data) {

  var dailyConfirmedCasesSeries = [];
  var dailyRecoveredCasesSeries = [];
  var dailyDeceasedCasesSeries = [];
  var cumlativeConfirmedCasesSeries = [];
  var cumlativeRecoveredCasesSeries = [];
  var cumlativeDeceasedCasesSeries = [];

  await data.forEach(element => {

    if (element[0] != "Date" && element[0] != null) {
      dailyConfirmedCasesSeries.push({
        "name": element[0],
        "value": element[1]
      })
      dailyRecoveredCasesSeries.push({
        "name": element[0],
        "value": element[2]
      })
      dailyDeceasedCasesSeries.push({
        "name": element[0],
        "value": element[3]
      })
      cumlativeConfirmedCasesSeries.push({
        "name": element[0],
        "value": element[4]
      })
      cumlativeRecoveredCasesSeries.push({
        "name": element[0],
        "value": element[5]
      })
      cumlativeDeceasedCasesSeries.push({
        "name": element[0],
        "value": element[6]
      })

    }
  });
  return {
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
  }
}
async function ConvertHospitalTestData(data) {
  var hospitalTestData = [];
  await data.forEach(element => {
    hospitalTestData.push({ name: element[0], totalCount: element[1] })
  });
  return hospitalTestData;
}

async function ConvertStateWiseData(data) {
  var stateWiseData = [];
  await data.forEach(element => {
    if (element[0] != "State" && element[0] != null) {
      stateWiseData.push(
        {
          state: element[0],
          confirmed: element[1],
          active: element[2],
          recovered: element[3],
          deceased: element[4]
        });
    }
  });
  await stateWiseData.sort(function (a, b) {
    return b.confirmed - a.confirmed;
  });
  return stateWiseData.slice(0, 5);
}

app.get('/', (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello World! Praveen Chandu Working on Covid");
});




const port = process.env.PORT || 1337;
app.listen(port);

console.log("Server running at http://localhost:%d", port);
