
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
package ENACTProducer.model.smoolcore;
       
import org.smool.kpi.model.smart.IAbstractOntConcept;
import ENACTProducer.model.smoolcore.IAlarm;
       
import ENACTProducer.model.smoolcore.INoiseInformation;
       
import ENACTProducer.model.smoolcore.IPhysicalLocation;
       

/**
 * This class implements interface for the ontology concept NoiseSensor
 * including all its properties.
 * @author Genrated via EMF OWL to java transformation
 * @version 1.0
 */

public interface INoiseSensor extends IAbstractOntConcept, IContinuousSensor{

   /*
 	* PROPERTIES: GETTERS AND SETTERS
 	*/
   
 	/**
 	* Sets the deviceID property.
 	* @param deviceID String value
 	*/
 	public INoiseSensor setDeviceID(String deviceID );

	/**
 	* Gets the deviceID property.
 	* @return a String value
	*/
 	public String getDeviceID();

 	/**
 	* Sets the vendor property.
 	* @param vendor String value
 	*/
 	public INoiseSensor setVendor(String vendor );

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
 	* Sets the noise property.
 	* @param noise INoiseInformation value
 	*/
 	public INoiseSensor setNoise(INoiseInformation noise );

	/**
 	* Gets the noise property.
 	* @return a INoiseInformation value
	*/
 	public INoiseInformation getNoise();

 	/**
 	* Sets the physicalLoc property.
 	* @param physicalLoc IPhysicalLocation value
 	*/
 	public INoiseSensor setPhysicalLoc(IPhysicalLocation physicalLoc );

	/**
 	* Gets the physicalLoc property.
 	* @return a IPhysicalLocation value
	*/
 	public IPhysicalLocation getPhysicalLoc();
}
