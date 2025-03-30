/**
 * IDS authoring module
 * Very incomplete and only a proof-of-concept for now.
 * Thanks to @Moult for suggesting this.
 */

let pyodide = null;

// IDS Python classes
let Ids, Specification;
let Entity, Attribute, Property, Material, Classification, PartOf;

export async function init(pdide) {
    pyodide = pdide;
    
    // Import the necessary modules
    await pyodide.loadPackagesFromImports(`
        import ifctester.ids
        import ifctester.facet
    `);
    
    // Import the core IDS classes
    Ids = pyodide.pyimport("ifctester.ids").Ids;
    Specification = pyodide.pyimport("ifctester.ids").Specification;
    
    // Import facet classes
    Entity = pyodide.pyimport("ifctester.facet").Entity;
    Attribute = pyodide.pyimport("ifctester.facet").Attribute;
    Property = pyodide.pyimport("ifctester.facet").Property;
    Material = pyodide.pyimport("ifctester.facet").Material;
    Classification = pyodide.pyimport("ifctester.facet").Classification;
    PartOf = pyodide.pyimport("ifctester.facet").PartOf;
}

// Helper function to convert date to ISO format string
export function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

export class IDS {
    ids_raw = null;

    constructor({title = "Untitled", copyright = null, version = null, description = null, author = null, date = null, purpose = null, milestone = null}) {
        this.ids_raw = Ids(title, copyright, version, description, author, formatDate(date), purpose, milestone);
    }

    // Validate IDS against it's standard XSD schema
    validateIds() {
        const tempFilename = `temp_${Date.now()}.xml`;
        const isValid = this.ids_raw.to_xml(tempFilename); // to_xml validates the XML as well, as far as I understand
        
        pyodide.runPython(`
            import os
            if os.path.exists("${tempFilename}"):
                os.remove("${tempFilename}")
        `);
        
        return isValid;
    }

    // Get IDS XML string
    exportIds() {
        return this.ids_raw.to_string();
    }

    // Returns the index of the specification in the list of specifications
    addSpecification({name = "Unnamed", minOccurs = 0, maxOccurs = "unbounded", ifcVersion = null, identifier = null, description = null, instructions = null, usage = "required"}) {
        const spec = Specification(name, minOccurs, maxOccurs, ifcVersion, identifier, description, instructions);
        spec.set_usage(usage);
        this.ids_raw.specifications.append(spec);
        return this.ids_raw.specifications.toJs().length - 1;
    }

    createEntityFacet({name = "IFCWALL", predefinedType = null, instructions = null}) {
        const entity = Entity(name, predefinedType, instructions);
        return entity;
    }

    createAttributeFacet({name = "Name", value = null, cardinality = "required", instructions = null}) {
        const attribute = Attribute(name, value, cardinality, instructions);
        return attribute;
    }

    addApplicability(specIndex, facet) {
        this.ids_raw.specifications[specIndex].applicability.append(facet);
    }

    addRequirement(specIndex, facet) {
        this.ids_raw.specifications[specIndex].requirements.append(facet);
    }
};