import * as lib from './lib.js';

const IFCOS_URL = "static/ifcopenshell-0.8.2+d50e806-cp312-cp312-emscripten_3_1_58_wasm32.whl";
const ODFPY_URL = "static/odfpy-1.4.3.dev0-py2.py3-none-any.whl";

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
let audit = {
    run: document.getElementById('run_audit'),
    ifc: document.getElementById('ifc_file'),
    ids: document.getElementById('ids_file')
};

// Load Pyodide
statusNode.innerHTML = "Initializing Pyodide...";
pyodide = await loadPyodide();

// Load dependencies
statusNode.innerHTML = "Loading modules...";

await pyodide.loadPackage("micropip");
await pyodide.loadPackage("numpy");

const micropip = pyodide.pyimport("micropip");
// await micropip.install("python-dateutil");
// await micropip.install("xmlschema");
// await micropip.install(ODFPY_URL);
// await micropip.install("pystache");

// bcf-client can't be directly installed, we must install deps first
// await micropip.install("xsdata"); // Dependency of bcf-client
// await pyodide.runPythonAsync(`
//     import micropip
//     await micropip.install("bcf-client", deps=False)
// `);

// Load IfcOpenShell
statusNode.innerHTML = "Loading IfcOpenShell...";
await micropip.install(IFCOS_URL);

// Load IfcTester
statusNode.innerHTML = "Loading IfcTester...";
await micropip.install("ifctester");

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

psets.run.onclick = async () => {
    const schema = schemaNode.value;
    const entity = psets.input.value;
    const result = await lib.getApplicablePsets(schema, entity);
    outputNode.innerHTML = JSON.stringify(result);
}

materials.run.onclick = async () => {
    const result = await lib.getMaterialCategories();
    outputNode.innerHTML = JSON.stringify(result);
}

classificationSystems.run.onclick = async () => {
    const result = await lib.getStandardClassificationSystems();
    outputNode.innerHTML = JSON.stringify(result);
}

audit.run.onclick = async () => {
    const ifc = audit.ifc.files[0];
    const ids = audit.ids.files[0];

    const ifcData = new Uint8Array(await ifc.arrayBuffer());
    const idsData = new Uint8Array(await ids.arrayBuffer());
    const ifc_id = ifc.name;
    const ids_id = ids.name;

    audit.run.innerHTML = "Running...";
    audit.run.disabled = true;
    const result = await lib.auditIfc(ifcData, idsData, ifc_id, ids_id);
    audit.run.innerHTML = "Run";
    audit.run.disabled = false;
    
    outputNode.innerHTML = JSON.stringify(result);
}