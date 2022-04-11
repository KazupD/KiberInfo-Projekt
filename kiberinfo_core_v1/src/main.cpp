#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

#define PWM 16
#define GENERATOR 32

// WiFi
const char *ssid = "EPSON"; // Enter your WiFi name
const char *password = "barackfa";  // Enter WiFi password

// MQTT Broker
const char *mqtt_broker = "broker.emqx.io";
const char *topic = "arsonesp";
const char *topic_in = "arsonespin";
const char *mqtt_username = "emqx";
const char *mqtt_password = "public";
const int mqtt_port = 1883;
long lastMsg = 0;

//PWM
const int freq = 1000;
const int channel = 0;
const int resolution = 8;
int dutyCycle = 0;

//MEASUREMENT RESISISTORS
const float R1 = 4700, R2 = 10000;
const float feszoszto = (R1+R2)/R2;

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char *topic_in, byte *payload, unsigned int length);
void reconnect();

void setup() {
  Serial.begin(115200);
  pinMode(GENERATOR, INPUT);
  // PWM
  ledcSetup(channel, freq, resolution);
  ledcAttachPin(PWM, channel);
  ledcWrite(channel, dutyCycle);

  // connecting to a WiFi network
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.println("Connecting to WiFi...");
    }
    Serial.println("Connected to the WiFi network");

    //connecting to a mqtt broker
    client.setServer(mqtt_broker, mqtt_port);
    client.setCallback(callback);
    while (!client.connected()) {
        String client_id = "esp32-client-";
        client_id += String(WiFi.macAddress());
        Serial.printf("The client %s connects to the public mqtt broker\n", client_id.c_str());
        if (client.connect(client_id.c_str(), mqtt_username, mqtt_password)) {
            Serial.println("Public emqx mqtt broker connected");
        } else {
            Serial.print("failed with state ");
            Serial.print(client.state());
            delay(2000);
        }
    }

    // publish and subscribe
    client.publish(topic, "Hi EMQX I'm ESP32");
    client.subscribe(topic_in);
  
}


void callback(char *topic_in, byte *payload, unsigned int length) 
{

    Serial.print("Message arrived in topic: ");
    Serial.println(topic_in);
    Serial.print("Message:");
    int i;
    for (i=0; i < length; i++) {
        Serial.print((char) payload[i]);
    }
    //BEJÖVŐ PARANCSOK FELDOLGOZÁSA

    if(payload[0] == 'd' && payload[1] == 'c')
    {

      if(i == 4 && isdigit((char)payload[2]))
      {
          int lastDC = dutyCycle;
          
          dutyCycle = ((char)payload[2]-'0');
          Serial.println("---Hallo---");
          if(dutyCycle > 255) dutyCycle=255;
          if(dutyCycle<0) dutyCycle =0;
          //ledcWrite(channel, dutyCycle);
          if(lastDC < dutyCycle){
            for(int z = lastDC; z <= dutyCycle; z++){
              ledcWrite(channel, z);
              delay(5);
            }
          }
          else{
            for(int z = lastDC; z >= dutyCycle; z--){
              ledcWrite(channel, z);
              delay(5);
            }
          }
      }

      if(i == 5 && isdigit((char)payload[2]) && isdigit((char)payload[3])){
        int lastDC = dutyCycle;
          
        dutyCycle = ((char)payload[2]-'0')*10+((char)payload[3]-'0');
        Serial.println("---Hallo---");
        if(dutyCycle > 255) dutyCycle=255;
        if(dutyCycle<0) dutyCycle =0;
        //ledcWrite(channel, dutyCycle);
          if(lastDC < dutyCycle){
            for(int z = lastDC; z <= dutyCycle; z++){
              ledcWrite(channel, z);
              delay(5);
            }
          }
          else{
            for(int z = lastDC; z >= dutyCycle; z--){
              ledcWrite(channel, z);
              delay(5);
            }
          }
      }

      if(i == 6 && isdigit((char)payload[2]) && isdigit((char)payload[3]) && isdigit((char)payload[4])){
        int lastDC = dutyCycle;

        dutyCycle = ((char)payload[2]-'0')*100+((char)payload[3]-'0')*10+((char)payload[4]-'0');
        Serial.println("---Hallo---");
        if(dutyCycle > 255) dutyCycle=255;
        if(dutyCycle<0) dutyCycle =0;
        //ledcWrite(channel, dutyCycle);

          if(lastDC < dutyCycle){
            for(int z = lastDC; z <= dutyCycle; z++){
              ledcWrite(channel, z);
              delay(5);
            }
          }
          else{
            for(int z = lastDC; z >= dutyCycle; z--){
              ledcWrite(channel, z);
              delay(5);
            }
          }
        }
    }
    //BEJÖVŐ PARANCSOK VÉGE
    Serial.println();
}


void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    String client_id = "esp32-client-";
     client_id += String(WiFi.macAddress());
     Serial.printf("The client %s connects to the public mqtt broker\n", client_id.c_str());
     if (client.connect(client_id.c_str(), mqtt_username, mqtt_password)) {
         Serial.println("Public emqx mqtt broker connected");
     } else {
         Serial.print("failed with state ");
         Serial.print(client.state());
         delay(2000);
     }
  }
    client.publish(topic, "Hi EMQX I'm ESP32, I am back.");
    client.subscribe(topic_in);
}


void loop() {
  

  if (!client.connected()) {
        reconnect();
    }
    client.loop();


    long now = millis();
    if (now - lastMsg > 2500) {
      lastMsg = now;
      
      float read_generator = analogRead(GENERATOR);
      float generator_voltage = map(read_generator, 0, 4095, 0, 330);
      generator_voltage *= feszoszto;
      
      Serial.print("Measured Voltage: "); Serial.print(read_generator); Serial.print(" = "); Serial.print(generator_voltage*0.01); Serial.print(" [V]"); Serial.println();

      Serial.print("Duty Cycle: "); Serial.print(dutyCycle); Serial.print(" / 255 = "); Serial.print((dutyCycle/255)*100); Serial.print(" [%]"); Serial.println();

      char outbuf[15];

      strcpy(outbuf, "gv");
      dtostrf(generator_voltage, 1, 0, outbuf+strlen(outbuf));
      strcat(outbuf, "dc");
      dtostrf(dutyCycle, 1, 0, outbuf+strlen(outbuf));
      Serial.println(outbuf);
      client.publish(topic, outbuf);

      
    }
}