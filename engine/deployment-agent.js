/*
* The deployment agent is reponsible for deployment software on devices that cannot be directly 
* accessed from the GeneSIS runtime. An agent is an instance of Node-red with a set of specific
* 'GeneSIS' nodes
*/

var emitter = require('events').EventEmitter;
var dc = require('./docker-connector.js');
var uuidv4 = require('uuid/v4');
var http = require('http');
var logger = require('./logger.js');

var deployment_agent = function (host, host_target, deployment_target) {
    var that={};
    that.emitter=new emitter();
    that.host=host;
    that.host_target=host_target;
    that.deployment_target=deployment_target;
    that.flow='';

    //We need to identify what should be in the deployment agent
    that.prepare= function(){
        that.flow='[{"id":"dac41de7.a03033","type":"tab","label":"Deployment Flow"}';
        if(host_target._type === "device"){
            var id_deployer_node_in_agent=uuidv4();
            if(host_target.device_type.indexOf("ardui") !== -1){
                that.flow+=',{"id": "'+id_deployer_node_in_agent+'","type": "arduino","z": "dac41de7.a03033","name": "'+that.host_target.name+'","serial": "7d118b53.12e99c","ardtype": "uno","cpu": "'+that.host_target.cpu+'","libraries": '+JSON.stringify(that.deployment_target.libraries)+',"x": 590,"y": 260, "wires": []},{"id": "7d118b53.12e99c","type": "serial-port","z": "","serialport": "'+that.host_target.physical_port+'","serialbaud": "9600","databits": "8","parity": "none","stopbits": "1","newline": "\\n","bin": "false","out": "char","addchar": false}';
            }
            if(deployment_target._type === "thingml"){
                var language="nodejs";
                if(host_target.device_type.indexOf("ardui") !== -1){
                    language="arduino";
                }
                that.flow+=',{"id": "'+uuidv4()+'","type": "thingml-compiler","z": "dac41de7.a03033","name": "'+that.deployment_target.name+'","active": true,"target": "'+language+'","triggerModified": "false","code": '+JSON.stringify(that.deployment_target.src)+',"source": "","sourcetype": "","sourcepath": "","x": 220,"y": 260, "wires": [["'+id_deployer_node_in_agent+'"]]}';
            }
        }
        that.flow += ']';
        
    };


    that.setFlow = function (tgt_host, tgt_port, data) {
        var options = {
            host: tgt_host,
            path: '/flows', //The Flows API of nodered, which set the active flow configuration
            port: tgt_port,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Node-RED-Deployment-Type': 'flows' //only flows that contain modified nodes are stopped before the new configuration is applied.
            }
        };

        var req = http.request(options, function (response) {
            var str = ''
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                logger.log("info","Request completed " + str);
            });
        });

        req.on('error', function (err) {
            logger.log("error","Connection to " + tgt_host + " not yet open");
            setTimeout(function () {
                that.setFlow(tgt_host, tgt_port, data); //we try to reconnect if the connection as failed
            }, 5000);
        });


        //This is the data we are posting, it needs to be a string or a buffer
        console.log("mmmm>"+ data);
        req.write(data);
        req.end();
    };

    that.install=function(){
        var connector = dc();
        //We start Node-red
        connector.buildAndDeploy(host.ip, host.port, {"1889":"1880"}, {
            "PathOnHost": that.host_target.physical_port,
            "PathInContainer": that.host_target.physical_port,
            "CgroupPermissions": "rwm"
        }, "", "nicolasferry/node-red-contrib-thingml-rpi:latest", "", that.deployment_target.name);
        //Then we install the nodes
        that.setFlow(host.ip, 1889, that.flow);
    };

    return that;
};

module.exports = deployment_agent;