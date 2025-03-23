import * as lib from './lib.js';

const IFCOS_URL = "static/ifcopenshell-0.8.2+d50e806-cp312-cp312-emscripten_3_1_58_wasm32.whl";
let statusNode = document.getElementById('status');
let outputNode = document.getElementById('output');
let pyodide = null;

let schemaNode = document.getElementById('schema');
let predefTypes = {
    input: document.getElementById('predef_types'),
    run: document.getElementById('run_predef_types')
};
let entityAttrs = {
    input: document.getElementById('entity_attrs'),
    run: document.getElementById('run_entity_attrs')
};
let psets = {
    input: document.getElementById('psets'),
    run: document.getElementById('run_psets')
};
let materials = {
    run: document.getElementById('run_materials')
};
let classificationSystems = {
    run: document.getElementById('run_systems')
};

// Load Pyodide
statusNode.innerHTML = "Initializing Pyodide...";
pyodide = await loadPyodide();

// Load dependencies
statusNode.innerHTML = "Loading modules...";

await pyodide.loadPackage("micropip");
await pyodide.loadPackage("numpy");
await pyodide.loadPackage("shapely");
const micropip = pyodide.pyimport("micropip");
await micropip.install("typing-extensions");

// Load IfcOpenShell
statusNode.innerHTML = "Loading IfcOpenShell...";
await micropip.install(IFCOS_URL);
statusNode.innerHTML = "Ready!";

// Initialize library
await lib.init(pyodide);
window.ifc = lib;

predefTypes.run.onclick = async () => {
    const schema = schemaNode.value;
    const entity = predefTypes.input.value;
    const result = await lib.getPredefinedTypes(schema, entity);
    outputNode.innerHTML = JSON.stringify(result);
};

entityAttrs.run.onclick = async () => {
    const schema = schemaNode.value;
    const entity = entityAttrs.input.value;
    const result = await lib.getEntityAttributes(schema, entity);
    outputNode.innerHTML = JSON.stringify(result);
}

// psets.run.onclick = async () => {
//     const schema = schemaNode.value;
//     const entity = psets.input.value;
//     const result = await lib.getApplicablePsets(schema, entity);
//     outputNode.innerHTML = JSON.stringify(result);
// }

materials.run.onclick = async () => {
    const result = await lib.getMaterialCategories();
    outputNode.innerHTML = JSON.stringify(result);
}

classificationSystems.run.onclick = async () => {
    const result = await lib.getStandardClassificationSystems();
    outputNode.innerHTML = JSON.stringify(result);
}