
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

/**
 * This class implements interface for the ontology concept PredefinedRule
 * including all its properties.
 * @author Genrated via EMF OWL to java transformation
 * @version 1.0
 */

public interface IPredefinedRule extends IAbstractOntConcept, IRule{

   /*
 	* PROPERTIES: GETTERS AND SETTERS
 	*/
   
 	/**
 	* Sets the ruleID property.
 	* @param ruleID String value
 	*/
 	public IPredefinedRule setRuleID(String ruleID );

	/**
 	* Gets the ruleID property.
 	* @return a String value
	*/
 	public String getRuleID();
}
