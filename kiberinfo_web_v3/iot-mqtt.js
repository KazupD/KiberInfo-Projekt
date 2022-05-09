const clientID = 'ws123';
// Create a client instance
const client = new Paho.MQTT.Client("broker.emqx.io", 8083, clientID);

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({onSuccess:onConnect});

let generatedvoltage = 0;
let dutycycle = 0;
let temperature =0;
let humidity =0;
let lightintensity =0;
let spdnow; let wspd;

spds = ["dc0", "dc147", "dc159", "dc171", "dc183", "dc195", "dc207", "dc219", "dc231", "dc243", "dc255"];
li_list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
gv_list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
tp_list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
hm_list = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


const plus10 = document.getElementById("plus10");
const minus10 = document.getElementById("minus10");
const maxspd = document.getElementById("maxspd");
const stopspd = document.getElementById("stopspd");

window.onload = function () {
  let dps_li = []; // dataPoints
  let dps_gv = [];
  let dps_tp = [];
  let dps_hm = [];
  let chart_li = new CanvasJS.Chart("li", {
    title :{
      text: "Light Intensity"
    },
    data: [{
      type: "line",
      dataPoints: dps_li
    },],
    axisY:[{ // retuned only if axisY is present
      viewportMinimum: 0,  //null for zoomType: "x"
      viewportMaximum: 120
      },
    ],
  });

  let chart_gv = new CanvasJS.Chart("gv", {
    title :{
      text: "Generated Voltage"
    },
    data: [{
      type: "line",
      dataPoints: dps_gv
    },],
    axisY:[{ // retuned only if axisY is present
      viewportMinimum: 0,  //null for zoomType: "x"
      viewportMaximum: 4
      },
    ],
  });

  let chart_tp = new CanvasJS.Chart("tp", {
    title :{
      text: "Temperature"
    },
    data: [{
      type: "line",
      dataPoints: dps_tp
    },],
    axisY:[{ // retuned only if axisY is present
      viewportMinimum: 0,  //null for zoomType: "x"
      viewportMaximum: 40
      },
    ],
  });

  let chart_hm = new CanvasJS.Chart("hm", {
    title :{
      text: "Humidity"
    },
    data: [{
      type: "line",
      dataPoints: dps_hm
    },],
    axisY:[{ // retuned only if axisY is present
      viewportMinimum: 0,  //null for zoomType: "x"
      viewportMaximum: 100
      },
    ],
  });

  let xVal = 0;
  let yVal_li = 0; 
  let yVal_gv = 0;
  let yVal_tp = 0;
  let yVal_hm = 0;
  let updateInterval = 1000;
  let dataLength = 20; // number of dataPoints visible at any point
  let updateChart = function () {
    
    for (let j = 0; j < 20; j++) {
      yVal_li = li_list[j];
      yVal_gv = gv_list[j];
      yVal_tp = tp_list[j];
      yVal_hm = hm_list[j];
      dps_li.push({
        x: xVal,
        y: yVal_li
      });
      dps_gv.push({
        x: xVal,
        y: yVal_gv
      })
      dps_tp.push({
        x: xVal,
        y: yVal_tp
      })
      dps_hm.push({
        x: xVal,
        y: yVal_hm
      })
      xVal++;
    }
    if (dps_li.length > dataLength) {
      for(let j = 0; j<20; j++){
      dps_li.shift();
      }
    }
    if (dps_gv.length > dataLength) {
      for(let j = 0; j<20; j++){
      dps_gv.shift();
      }
    }
    if (dps_tp.length > dataLength) {
      for(let j = 0; j<20; j++){
      dps_tp.shift();
      }
    }
    if (dps_hm.length > dataLength) {
      for(let j = 0; j<20; j++){
      dps_hm.shift();
      }
    }
    //console.log(dps_li.length);
    chart_li.render();
    chart_gv.render();
    chart_tp.render();
    chart_hm.render();
  };
  updateChart(dataLength);
  setInterval(function(){updateChart()}, updateInterval);
}


// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe("arsonesp");
  console.log("STOP");
  topicMessage = new Paho.MQTT.Message(spds[0]);
  topicMessage.destinationName = "arsonespin";
  client.send(topicMessage);
  spdnow=0; wspd=0;
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
  }
}

// called when a message arrives
function onMessageArrived(message) {
  //console.log("onMessageArrived:"+message.payloadString);
  let incoming=message.payloadString;
  //document.getElementById("incoming").textContent=incoming;
  generatedvoltage=Number(incoming.split('v').pop().split('d')[0])*0.01;
  dutycycle=(Number(incoming.split('c').pop().split('t')[0]));
  temperature=Number(incoming.split('p').pop().split('h')[0])*0.1;
  humidity=Number(incoming.split('m').pop().split('l')[0])*0.1;
  lightintensity=Number(incoming.substring(incoming.indexOf('i') + 1));
  generatedvoltage = Math.round(generatedvoltage * 100) / 100;
  dutycycle = Math.round(dutycycle * 100) / 100;
  temperature = Math.round(temperature * 100) / 100;
  humidity = Math.round(humidity * 100) / 100;
  lightintensity=Math.round(lightintensity * 100) / 100;
  if(dutycycle>=147){
    wspd = (5/6)*dutycycle-112.5;
    wspd = Math.round(Math.round(wspd * 100) / 100);
  }
  else{
    wspd = dutycycle/147*10;
    wspd = Math.round(Math.round(wspd * 100) / 100);
  }
  if(dutycycle == 0){generatedvoltage=0;}

  for(let j = 0; j<20; j++){
    if(j<19){li_list[j]=li_list[j+1];}
    else{li_list[j]=lightintensity};
  }
  for(let j = 0; j<20; j++){
    if(j<19){gv_list[j]=gv_list[j+1];}
    else{gv_list[j]=generatedvoltage};
  }
  for(let j = 0; j<20; j++){
    if(j<19){tp_list[j]=tp_list[j+1];}
    else{tp_list[j]=temperature};
  }
  for(let j = 0; j<20; j++){
    if(j<19){hm_list[j]=hm_list[j+1];}
    else{hm_list[j]=humidity};
  }


  document.getElementById("windspeed").textContent=String(wspd);
  document.getElementById("generatedvoltage").textContent=String(generatedvoltage);
  document.getElementById("temperature").textContent=String(temperature);
  document.getElementById("humidity").textContent=String(humidity);
  document.getElementById("lightintensity").textContent=String(lightintensity);
  document.getElementById("windspeed2").textContent="W.S.: "+String(wspd)+" [%]";
}

maxspd.addEventListener("click", function(){
  console.log("MAX");
  spdnow=10
  topicMessage = new Paho.MQTT.Message(spds[spdnow]);
  topicMessage.destinationName = "arsonespin";
  client.send(topicMessage);
});
plus10.addEventListener("click", function(){
  console.log("PLUS10");
  if(spdnow < 10){spdnow++;}
  topicMessage = new Paho.MQTT.Message(spds[spdnow]);
  topicMessage.destinationName = "arsonespin";
  client.send(topicMessage);
});
minus10.addEventListener("click", function(){
  console.log("MINUS10");
  if(spdnow > 0){spdnow--;}
  topicMessage = new Paho.MQTT.Message(spds[spdnow]);
  topicMessage.destinationName = "arsonespin";
  client.send(topicMessage);
});
stopspd.addEventListener("click", function(){
  console.log("STOP");
  spdnow=0;
  topicMessage = new Paho.MQTT.Message(spds[spdnow]);
  topicMessage.destinationName = "arsonespin";
  client.send(topicMessage);
});