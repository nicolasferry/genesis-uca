var webSocketServer = require('ws').Server;
var http = require('http');
var fs = require('fs');
var mm = require('../metamodel/allinone.js');
var dc = require('./docker-connector.js');
var sshc = require('./ssh-connector.js');
var bus = require('./event-bus.js');
var uuidv4 = require('uuid/v4');
var comp = require('./model-comparison.js');
var class_loader = require('./class-loader.js');
var agent = require('./deployment-agent.js');
var logger = require('./logger.js');
var ac=require('./ansible-connector.js');

var engine = (function () {
    var that = {};
    that.dep_model = 'undefined';
    that.diff = {};

    that.webSocketServerObject = new webSocketServer({
        port: 9060
    });

    that.socketObject = {};

    that.remove_containers = function (diff, dm) {
        var removed = diff.list_of_removed_components;
        var connector = dc();
        for (var i in removed) {
            var host_id = removed[i].id_host;
            var host = dm.find_node_named(host_id); //This cannot be done!
            if (host === undefined) {
                //Need to find the host in the old model
                var rem_hosts = diff.list_removed_hosts;
                var tab = rem_hosts.filter(function (elem) {
                    if (elem.name === host_id) {
                        return elem;
                    }
                });
                if (tab.length > 0) {
                    connector.stopAndRemove(removed[i].container_id, tab[0].ip, tab[0].port);
                }
            } else {
                connector.stopAndRemove(removed[i].container_id, host.ip, host.port);
            }
        }
    };


    //To be refactored
    bus.on('container-error', function (comp_name) {
        //Send status info to the UI
        var s = {
            node: comp_name,
            status: 'error'
        };
        that.socketObject.send("#" + JSON.stringify(s));
    });

    bus.on('container-config', function (comp_name) {
        //basically, host is accessible
        var host_id = that.dep_model.find_node_named(comp_name).id_host;
        var h = {
            node: host_id,
            status: 'running'
        };
        that.socketObject.send("#" + JSON.stringify(h));

        //Send status info to the UI
        var s = {
            node: comp_name,
            status: 'config'
        };
        that.socketObject.send("#" + JSON.stringify(s));
    });

    bus.on('link-ok', function (link_name) {
        var s = {
            node: link_name,
            status: 'OK'
        };
        that.socketObject.send("#" + JSON.stringify(s));
    });

    bus.on('link-ko', function (link_name) {
        var s = {
            node: link_name,
            status: 'KO'
        };
        that.socketObject.send("#" + JSON.stringify(s));
    });

    that.run = function (dm) { //TODO: factorize
        var comp = dm.get_all_hosted();
        var nb = 0;
        var tmp = 0;

        var links_deployer_tab = dm.get_all_deployer_links();
        //Deployment agent
        for (var l in links_deployer_tab) {
            nb++;
            var tgt_agent = dm.find_node_named(links_deployer_tab[l].target);
            var host_agent = dm.find_node_named(links_deployer_tab[l].src);
            var tgt_agent_host_id = tgt_agent.id_host;
            var tgt_agent_host = dm.find_node_named(tgt_agent_host_id);
            var src__agent_host_id = host_agent.id_host;
            var src_agent_host = dm.find_node_named(src__agent_host_id);

            var d_agent = agent(src_agent_host, tgt_agent_host, tgt_agent);
            d_agent.prepare();
            d_agent.install();
        }

        for (var i in comp) {
            var host_id = comp[i].id_host;
            var host = dm.find_node_named(host_id);
            if (host !== undefined) {
                if (host._type === "docker_host") {
                    var connector = dc();
                    nb++;
                    if (comp[i]._type === "node_red") {
                        //then we deploy node red
                        //TODO: what if port_bindings is empty?
                        connector.buildAndDeploy(host.ip, host.port, comp[i].docker_resource.port_bindings, comp[i].docker_resource.devices, "", "nicolasferry/node-red-contrib-thingml-rpi:latest", comp[i].docker_resource.mounts, comp[i].name); //
                    } else {
                        connector.buildAndDeploy(host.ip, host.port, comp[i].docker_resource.port_bindings, comp[i].docker_resource.devices, comp[i].docker_resource.command, comp[i].docker_resource.image, comp[i].docker_resource.mounts, comp[i].name);
                    }
                }
                if(comp[i].ansible_resource.playbook_path !== ""){
                    var connector= ac(host, comp[i].ansible_resource);
                    connector.executePlaybook();
                }
            }
        }


        //We collect all the started events, once they are all received we generate the flow skeleton based on the links
        bus.on('container-started', function (container_id, comp_name) {
            tmp++;
            //console.log(tmp + ' :: ' + nb);
            //Add container id to the component
            var comp = dm.find_node_named(comp_name);
            comp.container_id = container_id;


            //Send status info to the UI
            var s = {
                node: comp_name,
                status: 'running'
            };
            that.socketObject.send("#" + JSON.stringify(s));

            if (tmp >= nb) {
                tmp = 0;

                var comp_tab = dm.get_all_hosted();
                //For all Node-Red hosted components we generate the websocket proxies
                for (var i in comp_tab) {
                    if (comp_tab[i]._type === 'node_red') {
                        var host_id = comp_tab[i].id_host;
                        var host = dm.find_node_named(host_id);

                        //Get all links that start from the component
                        var src_tab = dm.get_all_outputs_of_component(comp_tab[i]);
                        //Get all links that end in the component
                        var tgt_tab = dm.get_all_inputs_of_component(comp_tab[i]);

                        if ((src_tab.length > 0) || (tgt_tab.length > 0)) {

                            that.getCurrentFlow(host.ip, comp_tab[i].port, src_tab, tgt_tab, dm, that.generate_components);

                        }
                    }
                }
            }
        });
    };


    //This part has to be heavily refactored... Too late for this right now...
    that.generate_components = function (ip_host, tgt_port, src_tab, tgt_tab, dm, old_components) {
        //We keep the old elements without the generated ones
        var filtered_old_components = old_components.filter(function (elem) {
            if (elem.name !== undefined) {
                if (!elem.name.startsWith("to_") && !elem.name.startsWith("from_")) {
                    return elem;
                }
            }
        });

        var flow = '[{"id":"dac41de7.a03038","type":"tab","label":"Flow 1"},';
        var dependencies = "";
        var tab = uuidv4();

        //For each link starting from the component we add a websocket out component
        for (var j in src_tab) {
            var tgt_component = dm.find_node_named(src_tab[j].target);
            var source_component = dm.find_node_named(src_tab[j].src);
            var tgt_host_id = tgt_component.id_host;
            var tgt_host = dm.find_node_named(tgt_host_id);
            var src_host_id = source_component.id_host;
            var src_host = dm.find_node_named(src_host_id);

            if (tgt_component._type === 'node_red' && source_component._type === 'node_red') {
                var client = uuidv4();
                flow += '{"id":"' + uuidv4() + '","type":"websocket out","z": "dac41de7.a03038","name":"to_' + tgt_component.name + '","server":"","client":"' + client + '","x":331.5,"y":237,"wires":[]},{"id":"' + client + '","type":"websocket-client","path":"ws://' + tgt_host.ip + ':' + tgt_component.port + '/ws/' + source_component.name + '","wholemsg":"false"},';
            } else {
                if (source_component._type === 'node_red') { //Check if we have a plugin for this type of component
                    if (tgt_component.nr_description !== undefined && tgt_component.nr_description !== "") {
                        for (w in tgt_component.nr_description.node) {
                            var _tmp = tgt_component.nr_description.node[w];
                            _tmp.z = "dac41de7.a03038";
                            if (_tmp.serialport !== undefined && _tmp.serialport !== "") {
                                _tmp.serialport = tgt_host.physical_port;
                            }
                            flow += JSON.stringify(_tmp) + ','; //how could we configure this?
                        }
                        if (tgt_component.nr_description.package !== undefined) {
                            dependencies = '{"module": "' + tgt_component.nr_description.package + '"}'; //What if several?
                        }
                    }
                }
            }
        }

        //For each link ending in the component we add a websocket in component
        for (var z in tgt_tab) {
            var server = uuidv4();
            var target_component = dm.find_node_named(tgt_tab[z].target);
            var src_component = dm.find_node_named(tgt_tab[z].src);
            if (src_component._type === 'node_red' && target_component._type === 'node_red') {
                flow += '{"id":"' + uuidv4() + '","type":"websocket in","z": "dac41de7.a03038","name":"from_' + src_component.name + '","server":"' + server + '","client":"","x":143.5,"y":99,"wires":[]},{"id":"' + server + '","type":"websocket-listener","path":"/ws/' + src_component.name + '","wholemsg":"false"},';
            }
        }

        //Remove the last ','
        flow = flow.slice(0, -1);
        //Close the flow description
        flow += ']';

        //We concat the old flow with the new one
        if (flow.length > 2) { // not empty "[]"
            var t = JSON.parse(flow);
            var result = filtered_old_components.concat(t)
            if (dependencies !== "") {
                that.installNodeType(ip_host, tgt_port, dependencies, function (str) {
                    that.setFlow(ip_host, tgt_port, JSON.stringify(result), tgt_tab, src_tab, dm);
                });
            } else {
                that.setFlow(ip_host, tgt_port, JSON.stringify(result), tgt_tab, src_tab, dm);
            }

        }
    }


    //To be migrated in a node-red connector
    that.installNodeType = function (tgt_host, tgt_port, data, callback) {
        var options = {
            host: tgt_host,
            path: '/nodes',
            port: tgt_port,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        var req = http.request(options, function (response) {
            var str = ''
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                logger.log("info", "Install Request completed " + str);
                bus.emit('node installed', str);
                callback(str);
            });

        });

        req.on('error', function (err) {

        });

        req.write(data);
        req.end();

    };

    //TO be migrated in a node-red connector
    that.getCurrentFlow = function (tgt_host, tgt_port, src_tab, tgt_tab, dm, callback) {
        var opt = {
            host: tgt_host,
            path: '/flows', //The Flows API of nodered, which set the active flow configuration
            port: tgt_port
        };
        http.get(opt, function (resp) {
            resp.on('data', function (chunk) {
                var d_flow = [];
                if (Array.isArray(JSON.parse(chunk))) {
                    d_flow = JSON.parse(chunk);
                }
                callback(tgt_host, tgt_port, src_tab, tgt_tab, dm, d_flow);
            });
        }).on("error", function (e) {
            logger.log("warning", "Cannot get current Node-red flow: " + e.message);
            setTimeout(function () { //Should only test n times
                that.getCurrentFlow(tgt_host, tgt_port, src_tab, tgt_tab, dm, callback);
            }, 2000);
        });
    };

    //TO be migrated in a node-red connector
    that.setFlow = function (tgt_host, tgt_port, data, tgt_tab, src_tab, dm) {
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
                logger.log("info", "Request to upload Node-Red flow completed " + str);
                for (var w in tgt_tab) { //if success, send feedback
                    bus.emit('link-ok', tgt_tab[w].name);
                }
                for (var p in src_tab) { //if success, send feedback
                    if (dm.find_node_named(src_tab[p].target).nr_description !== undefined) {
                        bus.emit('link-ok', src_tab[p].name);
                    }
                }
            });

        });

        req.on('error', function (err) {
            logger.log("info", "Connection to " + tgt_host + " not yet open");
            setTimeout(function () {
                for (var w in tgt_tab) {
                    bus.emit('link-ko', tgt_tab[w].name);
                }
                setFlow(tgt_host, tgt_port, data, tgt_tab); //we try to reconnect if the connection as failed
            }, 5000);
        });


        //This is the data we are posting, it needs to be a string or a buffer
        req.write(data);
        req.end();
    }

    that.start = function () {

        that.webSocketServerObject.on('connection', function (socketObject) {
            that.socketObject = socketObject;
            //Load component types from the repository
            var cl = class_loader();
            cl.findModules({
                folder: './repository'
            }, function (modules) {
                //Create a deployment model
                var dm = mm.deployment_model({});
                //Add types to the registry before we create the instances
                dm.type_registry = modules; //can be used as follows modules[i].module({})

                var tab = [];
                var mmodel = "";
                for (var j = 0; j < modules.length; j++) {
                    var tmp = {};
                    tmp.id = modules[j].id.replace('.js', '');
                    var comp = modules[j].module({});
                    (comp.id_host === undefined) ? tmp.isExternal = true: tmp.isExternal = false;
                    tmp.module = comp;
                    tab.push(tmp);
                }
                that.socketObject.send("@" + JSON.stringify(tab));


                //Wait for a model from the editor
                socketObject.on('message', function (message) {

                    //Load the model
                    logger.log("info", "Received model from the editor");
                    var data = JSON.parse(message);

                    dm.revive_components(data.components);
                    dm.revive_links(data.links);

                    logger.log("info", "Model Loaded: " + JSON.stringify(dm.components));

                    if (that.dep_model === 'undefined') {
                        that.dep_model = dm;
                        //Deploy: keep it because I know it works :p
                        //TODO: remove this
                        logger.log("info", "Starting deployment");
                        that.run(that.dep_model);
                    } else {
                        //Compare model
                        var comparator = comp(that.dep_model);
                        that.diff = comparator.compare(dm);
                        that.dep_model = dm; //target model becomes current

                        //First do all the removal stuff
                        logger.log("info", "Stopping removed containers");
                        that.remove_containers(that.diff, that.dep_model);

                        //Deploy only the added stuff
                        logger.log("info", "Starting new containers");
                        deploy(that.diff, that.dep_model);

                    }
                });
            });

            socketObject.on('close', function (c, d) {
                logger.log('info', 'Disconnect ' + c + ' -- ' + d);
            });

        });
    };

    return that;
}());



//TODO: to be factorised with the run function. This class should be heavily refactored
function deploy(diff, dm) {
    var comp = diff.list_of_added_components;
    var nb = 0;

    for (var i in comp) {
        var host_id = comp[i].id_host;
        var host = dm.find_node_named(host_id);
        var connector = dc();
        if (host._type === "docker_host") {
            nb++;
            if (comp[i]._type === "node_red") {
                //then we deploy node red
                //TODO: what if port_bindings is empty?
                connector.buildAndDeploy(host.ip, host.port, comp[i].docker_resource.port_bindings, comp[i].docker_resource.devices, "", "nicolasferry/enact-framework", comp[i].docker_resource.mounts, comp[i].name); //
            } else {
                connector.buildAndDeploy(host.ip, host.port, comp[i].docker_resource.port_bindings, comp[i].docker_resource.devices, comp[i].docker_resource.command, comp[i].docker_resource.image, comp[i].docker_resource.mounts, comp[i].name);
            }
        }
    }

    bus.on('container-started', function (container_id, comp_name) {
        tmp++;
        console.log(tmp + ' :: ' + nb);
        //Add container id to the component
        var comp = dm.find_node_named(comp_name);
        comp.container_id = container_id;


        //Send status info to the UI
        var s = {
            node: comp_name,
            status: 'running'
        };
        that.socketObject.send("#" + JSON.stringify(s));

        if (tmp >= nb) {
            tmp = 0;

            var comp_tab = dm.get_all_hosted();

            //For all hosted components we generate the websocket proxies
            for (var i in comp_tab) {
                var host_id = comp_tab[i].id_host;
                var host = dm.find_node_named(host_id);
            }

            //Get all links that start from the component
            var src_tab = dm.get_all_outputs_of_component(comp_tab[i]).filter(function (elem) {
                if (diff.list_of_added_links.includes(elem)) {
                    return elem;
                }
            });
            //Get all links that end in the component
            var tgt_tab = dm.get_all_inputs_of_component(comp_tab[i]).filter(function (elem) {
                if (diff.list_of_added_links.includes(elem)) {
                    return elem;
                }
            });

            if ((src_tab.length > 0) || (tgt_tab.length > 0)) {

                that.getCurrentFlow(host.ip, comp_tab[i].port, src_tab, tgt_tab, dm, that.generate_components);

            }

        }

    });

    return nb;
}


module.exports = engine;