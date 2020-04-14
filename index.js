const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
var request = require('request');
const XLSX = require('xlsx');
const app = express();
const server = http.createServer((request, response) => {
    response.writeHead(200, {"Content-Type": "text/plain"});
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
    await request('https://covid19proarch.blob.core.windows.net/datasets/India%20_hospital_testing_data.xlsx',
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
  
      if (element[0] != "Date"  && element[0] != null) {
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



const port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);
