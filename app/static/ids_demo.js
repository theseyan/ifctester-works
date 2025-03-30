import * as IDS from './ids.js';

export default async function() {
    const ids = new IDS.IDS({
        title: "Building Elements Requirements",
        copyright: "Copyright (C) 2025",
        author: "me@seyan.co",
        date: new Date(),
        version: "1.0"
    });
    
    // Create a specification
    const spec = ids.addSpecification({
        name: "All walls must have a name",
        ifcVersion: ["IFC4"],
        usage: "required"
    });
    
    // Applies to all IfcWalls
    const wallEntity = ids.createEntityFacet({ name: "IFCWALL" });
    ids.addApplicability(spec, wallEntity);
    
    // Must have a name attribute
    const nameAttr = ids.createAttributeFacet({ name: "Name" });
    ids.addRequirement(spec, nameAttr);
    
    // Validate the IDS
    if (!ids.validateIds()) {
        alert("Invalid IDS!");
        return;
    }

    // Return the XML string
    return ids.exportIds();
}