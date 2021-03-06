# Deploying a ThingML program

In this example we will simply deploy a program written in ThingML on the machine running GeneSIS (or on any machine accessible via SSH).

GeneSIS offers specific support for the deployment of ThingML programs. [ThingML](http://thingml.org/) is a domain specific language for modelling distributed IoT systems including the behavior of the distributed components in a platform-specific or -independent way. From a ThingML code, the ThingML compiler can generate code in different languages, targeting around 10 different target platforms (ranging from tiny 8 bit microcontrollers to servers). This is particularly interesting for GeneSIS as, from a deployment model, the GeneSIS execution engine can identify the host to which a ThingML source code should be allocated and thus generate code in the relevant language before compiling and deploying it on the host. 
The deployment of a ThingML program by GeneSIS consist in: (i) Compiling the ThingML program toward a specific target language, (ii) building the generated code, and (iii) deploying and starting it.

For this tutorial, we assume that:
1. The machine running where we will deploy our ThingML program is accessible via SSH (e.g., a Raspberry Pi) and has Java properly installed.
2. The machine running GeneSIS  (e.g., your laptop) has Java and Maven properly installed.

## Start GeneSIS:

First, let’s start GeneSIS by using the following command in the root folder of GeneSIS:

        npm start

You should see the following message:

       > GeneSIS@0.0.1 start /Users/ferrynico/Documents/Code/GeneSIS-gitlab/GeneSIS-v2/GeneSIS
        > concurrently "nodemon ./app.js" "webpack-dev-server "

        [0] [nodemon] 1.18.11
        [0] [nodemon] to restart at any time, enter `rs`
        [0] [nodemon] watching: *.*
        [0] [nodemon] starting `node ./app.js`
        [0] 2019-05-09T07:28:29.357Z - [info]: Engine started!
        [0] 2019-05-09T07:28:29.452Z - [info]: PlantUML diagram generator started on port: 8080
        [0] 2019-05-09T07:28:29.469Z - [info]: GeneSIS Engine API started on 8000
        [0] 2019-05-09T07:28:29.471Z - [info]: MQTT websocket server listening on port 9001
        [0] 2019-05-09T07:28:29.639Z - [info]: New MQTT client mqttjs_52139cc4
        [0] 2019-05-09T07:28:29.701Z - [info]: subscribe from client [object Object],[object Object] from mqttjs_52139cc4
        [1] ℹ ｢wds｣: Project is running at http://localhost:8880/
        [1] ℹ ｢wds｣: webpack output is served from http://127.0.0.1:8880/dist/
        [1] ℹ ｢wds｣: Content not from webpack is served from /Users/ferrynico/Documents/Code/GeneSIS-gitlab/GeneSIS-v2/GeneSIS/public/
        [0] 2019-05-09T07:28:30.489Z - [info]: New MQTT client mqttjs_75f09b96

Once GeneSIS started, you can access the GeneSIS editor at the following address:

        http://127.0.0.1:8880

## Specifying the deployment model


We can now start specifying our deployment model. 
In this example, our deployment model will be composed of two components: 
* a _SoftwareComponent_ (i.e., representing the program written in ThingML that will be deployed by GeneSIS) and more precisely an _InternalComponent_ as its deployment life-cycle will be managed by GeneSIS.
* an _InfrastructureComponent_ (i.e., the host on top of which we will deploy our SoftwareComponent).

First, we start by creating the InfrastructureComponent by clicking on 'Edit > Infrastructure Component > Device'.
In the creation form we specify its 'name' and we fill the field 'IP' with the IP address of the host on top of which our program written in ThingML will be deployed. Once the form completed we can click on the 'OK' button to actually add the component in the deployment model.
For details on how to manipulate and edit components with the GeneSIS editor, please refer to our [first tutorial](https://gitlab.com/enact/GeneSIS/tree/master/docs/examples/1.nodered_localhost).

![alt text](./images/my_machine.png "Device Component")

We can now create the SoftwareComponent by clicking on 'Edit > Software Component > Internal > thingml'. For this tutorial we provide a simple [ThingML Hello world program](https://gitlab.com/enact/GeneSIS/blob/master/docs/examples/2.thingml_localhost/hello.thingml) whose name is Hello (i.e., name of the _Configuration_ in ThingML).
For GeneSIS to fully support the deployment, compilation and deployment of ThingML programs it is important that **the name of the ThingML InternalComponent is the same than the name of the ThingML program**. We thus set the name of our component to Hello.
We also need to fill the field "File" with the path to the [Hello.thingml](https://gitlab.com/enact/GeneSIS/blob/master/docs/examples/2.thingml_localhost/hello.thingml) file.

Finally, because there might be different ways to start the binary generated from the ThingML program, we need to specify how to start it.
For that, we will use a _SSH-Resource_. In the GeneSIS Modelling language A _SoftwareComponent_ can be associated with _Resources_ (e.g., scripts, configuration files) adopted to manage its deployment life-cycle (i.e., download, configure, install, start, and stop).
In our case we need to define (i) the _startCommand_ of our SSH-Resource describing how to start our SoftwareComponent and (ii) the credentials for accessing our Host. 
Please note that in the _startCommand_, **the name of the .jar file must start with the same name of the configuration in the ThingML file**. For example, in the hello.thingml file, with this line 'configuration Hello', the generated .jar file will be 'hello-1.0.0-jar-with-dependencies.jar'.

![alt text](./images/ssh_resource.png "SSH-resource")

We also need to specify that we should generate Java code from our ThingML program. To do so, we set the property 'target_language' to 'java'.

Finally, we specify that our InternalComponent will be deployed on our InfrastructureComponent. To do so, we need (i) to specify the execution ports of our components and (ii) to create a containement relationship between the two components.
We first specify the provided execution port of the docker host (i.e., my_machine). Right-click on the Docker Host and change the name of the 'provided execution port' property (e.g., offerJava).
Similarly right-click on the Software component (i.e., hello) and change the name of the required execution port (e.g., demandJava).

Then we can add the containment relationship by clicking on 'Edit > Link > Add Containment'.
Select the proper nodes and click on 'add'. The circle should now be contained by the rectangle as depicted in the Figure below.

## Deploy

Click on 'Deploy > All'. This will send our deployment model to the GeneSIS deployment engine and trigger the deployment.

These are the steps performed during the deployment:
1. On the machine running GeneSIS, the ThingML sources are compiled toward the target language and the UML diagrams representing your ThingML program. All these files are located in the folder named "generated" located at the root of your project.
2. On the machine running GeneSIS, the generated program is built. In our case using maven.
3. From the machine running GeneSIS, an SSH connection is created to upload the generated binaries on the host.
4. From the machine running GeneSIS, an SSH connection is created to start the uploaded program based on the "startCommand" specified in the ssh-resource.

Once the deployment started, you can observe deployment logs in the console where you started GeneSIS. In particular, you will see: (i) the ThingML compiler generating the Java code, (ii) the generated code being build, and (iii) the generated binary being uploaded on the target host before it is started.
Once the deployment completed, you should see the logs depicted in the figure below (please note that the highlighted line indicates the result of the execution of the ThingML program). 

![alt text](./images/shell.png "Device Component")

We have shown the deployment of a single .thingml file for simplicity. Note that ThingML code can span several .thingml files. 
We only need to specify in GeneSIS the main ThingML file that contain 'configuration', like we have done with the hello.thingml file above. 
The other .thingml files will be compiled together with the main .thingml file. 
