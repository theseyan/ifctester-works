/**
 * Library API
*/

let pyodide = null;

export async function init(pdide) {
    pyodide = pdide;
    await pyodide.runPythonAsync(`
        from pyodide.http import pyfetch
        response = await pyfetch("static/autocompletions.py")
        with open("autocompletions.py", "wb") as f:
            f.write(await response.bytes())
    `)
}

export async function getPredefinedTypes(schema, entity) {
    const result = await pyodide.runPythonAsync(`
        from autocompletions import get_predefined_types_for_entity
        predef_types = get_predefined_types_for_entity("${schema}", "${entity}")
        predef_types
    `);

    return result.toJs();
}

export async function getEntityAttributes(schema, entity) {
    const result = await pyodide.runPythonAsync(`
        from autocompletions import get_entity_attributes
        attrs = get_entity_attributes("${schema}", "${entity}")
        attrs
    `);

    return result.toJs();
}

export async function getApplicablePsets(schema, entity) {
    const result = await pyodide.runPythonAsync(`
        from autocompletions import get_applicable_psets
        psets = get_applicable_psets("${schema}", "${entity}")
        psets
    `);

    return result.toJs();
}

export async function getMaterialCategories() {
    const result = await pyodide.runPythonAsync(`
        from autocompletions import get_material_categories
        materials = get_material_categories()
        materials
    `);

    return result.toJs();
}

export async function getStandardClassificationSystems() {
    const result = await pyodide.runPythonAsync(`
        from autocompletions import get_standard_classification_systems
        systems = get_standard_classification_systems()
        systems
    `);

    return result.toJs();
}

// Both IFC and IDS arguments are Uint8Arrays (file contents)
export async function auditIfc(ifcData, idsData, ifc_id, ids_id) {
    // Write the files to Python's filesystem
    const ifcPath = `/tmp/${ifc_id}.ifc`;
    const idsPath = `/tmp/${ids_id}.ids`;
    pyodide.FS.writeFile(ifcPath, ifcData);
    pyodide.FS.writeFile(idsPath, idsData);

    const result = await pyodide.runPythonAsync(`
        import ifcopenshell
        import ifctester
        import ifctester.reporter
        import os

        specs = ifctester.open("${idsPath}")
        ifc = ifcopenshell.open("${ifcPath}")

        specs.validate(ifc)
        os.remove("${ifcPath}")
        os.remove("${idsPath}")

        engine = ifctester.reporter.Json(specs)
        engine.report()
        report = engine.to_string()
        report
    `);

    return JSON.parse(result);
}