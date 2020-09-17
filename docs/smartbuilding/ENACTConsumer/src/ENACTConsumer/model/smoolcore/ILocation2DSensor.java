
/*******************************************************************************
* Copyright (c) 2018 Tecnalia Research and Innovation.
* All rights reserved. This program and the accompanying materials
* are made available under the terms of the Eclipse Public License v1.0
* which accompanies this distribution, and is available at
* http://www.eclipse.org/legal/epl-v10.html
* This file is a result of OWL 2 java transformation using EMF
* 
* Generated by SMOOL SDK Wizard
*******************************************************************************/ 
package ENACTConsumer.model.smoolcore;
       
import org.smool.kpi.model.smart.IAbstractOntConcept;
import ENACTConsumer.model.smoolcore.IAlarm;
       
import ENACTConsumer.model.smoolcore.IPhysicalLocation;
       
import ENACTConsumer.model.smoolcore.ILocation2D;
       

/**
 * This class implements interface for the ontology concept Location2DSensor
 * including all its properties.
 * @author Genrated via EMF OWL to java transformation
 * @version 1.0
 */

public interface ILocation2DSensor extends IAbstractOntConcept, ILocationSensor{

   /*
 	* PROPERTIES: GETTERS AND SETTERS
 	*/
   
 	/**
 	* Sets the deviceID property.
 	* @param deviceID String value
 	*/
 	public ILocation2DSensor setDeviceID(String deviceID );

	/**
 	* Gets the deviceID property.
 	* @return a String value
	*/
 	public String getDeviceID();

 	/**
 	* Sets the vendor property.
 	* @param vendor String value
 	*/
 	public ILocation2DSensor setVendor(String vendor );

	/**
 	* Gets the vendor property.
 	* @return a String value
	*/
 	public String getVendor();

 	/**
 	* Adds the alarms property.
 	* @param alarms IAlarm value to add
 	*/
 	public void addAlarms(IAlarm alarms );

	/**
 	* Removes the alarms property.
 	* @param alarms IAlarm value to remove
	*/
 	public void removeAlarms(IAlarm alarms );

 	/**
 	* Sets the location property.
 	* @param location IPhysicalLocation value
 	*/
 	public ILocation2DSensor setLocation(IPhysicalLocation location );

	/**
 	* Gets the location property.
 	* @return a IPhysicalLocation value
	*/
 	public IPhysicalLocation getLocation();

 	/**
 	* Sets the location2d property.
 	* @param location2d ILocation2D value
 	*/
 	public ILocation2DSensor setLocation2d(ILocation2D location2d );

	/**
 	* Gets the location2d property.
 	* @return a ILocation2D value
	*/
 	public ILocation2D getLocation2d();

 	/**
 	* Sets the physicalLoc property.
 	* @param physicalLoc IPhysicalLocation value
 	*/
 	public ILocation2DSensor setPhysicalLoc(IPhysicalLocation physicalLoc );

	/**
 	* Gets the physicalLoc property.
 	* @return a IPhysicalLocation value
	*/
 	public IPhysicalLocation getPhysicalLoc();
}
