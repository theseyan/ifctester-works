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