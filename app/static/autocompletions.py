# JSON Generator for IFC schema information required for autocompletions in the web IfcTester UI

import ifcopenshell
import ifcopenshell.util
import ifcopenshell.util.pset
import ifcopenshell.util.schema
import gzip
import json
import argparse
import sys

# https://github.com/buildingSMART/IDS/blob/9914d568c7ac037acd97e58a0d16e9f93c3e3416/Schema/ids.xsd#L232
ifc_schemas = ["IFC2X3", "IFC4", "IFC4X3_ADD2"]

def get_predefined_types_for_entity(schema_name, entity_name):
    """Get a list of predefined types for a given entity."""

    schema = ifcopenshell.schema_by_name(schema_name)
    entity = schema.declaration_by_name(entity_name)
    
    if not entity or not entity.as_entity():
        print(f"Entity {entity_name} not found")
        return []
    
    entity = entity.as_entity()
    predefined_type_attr = None
    
    # Check all attributes for "PredefinedType"
    for attr in entity.all_attributes():
        if attr.name() == "PredefinedType":
            predefined_type_attr = attr
            break
    
    if not predefined_type_attr:
        return []
    
    param_type = predefined_type_attr.type_of_attribute()
    
    if param_type.as_named_type():
        enum_decl = param_type.as_named_type().declared_type()
        if enum_decl.as_enumeration_type():
            return enum_decl.as_enumeration_type().enumeration_items()
    
    return []

def get_entity_attributes(schema_name, entity_name):
    """Get all attributes for a given entity."""

    schema = ifcopenshell.schema_by_name(schema_name)
    entity = schema.declaration_by_name(entity_name)
    
    if not entity or not entity.as_entity():
        print(f"Entity {entity_name} not found")
        return None
    
    entity = entity.as_entity()
    attributes = []
    for attr in entity.all_attributes():
        attributes.append({
            "name": attr.name(),
            # "type": attr.type_of_attribute() # TODO Types of attribute
        })
    
    return attributes

def get_applicable_psets(schema_name, entity_name, predefined_type = ""):
    """Get all applicable property and quantity sets for a given entity."""

    pset_qto = ifcopenshell.util.pset.PsetQto(schema_name)
    pset_names = pset_qto.get_applicable_names(entity_name, predefined_type)
    
    return pset_names

def get_all_psets(schema_name):
    """Get all property sets and quantity sets defined in an IFC schema"""

    pset_qto = ifcopenshell.util.pset.PsetQto(schema_name)
    result = {}
    
    for template_file in pset_qto.templates:
        for pset_template in template_file.by_type("IfcPropertySetTemplate"):
            pset_name = pset_template.Name
            properties = []
            
            # Get property templates for this pset
            if pset_template.HasPropertyTemplates:
                for prop_template in pset_template.HasPropertyTemplates:
                    prop_info = {
                        "name": prop_template.Name,
                        # "description": prop_template.Description # TODO: Use descriptions?
                    }
                    
                    # Extract type information
                    if prop_template.is_a("IfcSimplePropertyTemplate"):
                        if prop_template.PrimaryMeasureType:
                            prop_info["type"] = prop_template.PrimaryMeasureType
                        else:
                            prop_info["type"] = str(prop_template.TemplateType)
                    elif prop_template.is_a("IfcComplexPropertyTemplate"):
                        prop_info["type"] = None # Complex properties are not supported
                    else:
                        prop_info["type"] = None
                    
                    properties.append(prop_info)
            result[pset_name] = properties
    
    return result

def get_material_categories():
    return ['concrete', 'steel', 'aluminium', 'block', 'brick', 'stone', 'wood', 'glass', 'gypsum', 'plastic', 'earth']

def get_standard_classification_systems():
    return {
        'BB/SfB (3/4 cijfers)': {'source': 'Regie der Gebouwen', 'tokens': ['.']},
        'BIMTypeCode': {'source': 'BIMStockholm', 'tokens': None},
        'Common Arrangement of Work Sections (CAWS)': {'source': 'NBS', 'tokens': ['/']},
        'CBI Classification - Level 2': {'source': 'Masterspec', 'tokens': None},
        'CBI Classification - Level 4': {'source': 'Masterspec', 'tokens': None},
        'Rumsfunktionskoder CC001 - 001': {'source': 'BIMAlliance', 'tokens': ['-']},
        'CCS': {'source': 'Molio', 'tokens': None},
        'CCTB': {'source': 'CCT-Bâtiments', 'tokens': ['.']},
        'Funktionskoder Regionservice CD001 - 001': {'source': 'BIMAlliance', 'tokens': None},
        'Rumsfunktion Blekinge CD002 - 001': {'source': 'BIMAlliance', 'tokens': None},
        'EcoQuaestor Codetabel': {'source': 'EcoQuaestor', 'tokens': ['.', '-']},
        'GuBIMclass CA': {'source': 'GuBIMClass', 'tokens': ['.']},
        'GuBIMclass ES': {'source': 'GuBIMClass', 'tokens': ['.']},
        'MasterFormat': {'source': 'CSI', 'tokens': [' ', '.']},
        'NATSPEC Worksections': {'source': 'NATSPEC', 'tokens': None},
        'NBS Create': {'source': 'NBS', 'tokens': ['_', '/']},
        'NL/SfB (4 cijfers)': {'source': 'BIMLoket', 'tokens': ['.']},
        'NS 3451 - Bygningsdelstabell': {'source': 'Standard Norge', 'tokens': None},
        'OmniClass': {'source': 'OmniClass', 'tokens': ['-', ' ']},
        'ÖNORM 6241-2': {'source': 'freeBIM 2', 'tokens': None},
        'RICS NRM1': {'source': 'RICS', 'tokens': ['.']},
        'RICS NRM3': {'source': 'RICS', 'tokens': ['.']},
        'SFG20': {'source': 'SFG20', 'tokens': ['-']},
        'SINAPI': {'source': 'Caixa', 'tokens': ['/']},
        'STABU-Element': {'source': 'STABU', 'tokens': ['.']},
        'TALO 2000 Building Component Classification': {'source': 'Rakennustieto', 'tokens': ['.']},
        'TALO 2000 Hankenimikkeistö': {'source': 'Rakennustieto', 'tokens': ['.']},
        'Uniclass': {'source': 'RIBA Enterprises Ltd', 'tokens': ['_']},
        'Uniclass 2015': {'source': 'RIBA Enterprises Ltd', 'tokens': ['_']},
        'UniFormat': {'source': 'UniFormat', 'tokens': ['.']},
        'Uniformat': {'source': 'UniFormat', 'tokens': ['.']},
        'VMSW': {'source': 'VMSW', 'tokens': ['.']}
    }

def get_autocompletions(schema_name):
    schema = ifcopenshell.schema_by_name(schema_name)
    all_psets = get_all_psets(schema_name)
    all_psets_keys = list(all_psets.keys())
    classification_systems = get_standard_classification_systems()
    standard_materials = get_material_categories()
    total_entities_num = len(schema.entities())

    # Final result object
    result = {
        "propertySets": all_psets,
        "classificationSystems": classification_systems,
        "standardMaterials": standard_materials,
        "entities": {}
    }

    print(f"Serializing {total_entities_num} entities in {schema_name} schema")

    # Iterate through all entities in the schema
    for i, entity in enumerate(schema.entities(), start=1):
        entity_name = entity.name()
        predefined_types = get_predefined_types_for_entity(entity_name, schema)
        attributes = get_entity_attributes(schema, entity_name)
        
        result["entities"][entity_name] = {
            "predefinedTypes": predefined_types,
            "attributes": attributes,
            "propertySets": {
                "default": [],
                "predefinedTypes": {}
            }
        }

        # Get default property sets
        default_psets = []
        for pset_name in get_applicable_psets(schema_name, entity_name):
            default_psets.append(all_psets_keys.index(pset_name))
        result["entities"][entity_name]["propertySets"]["default"] = default_psets

        # Get property sets for each predefined type
        predef_types_psets = {}
        for predef_type in predefined_types:
            predef_type_pset = get_applicable_psets(schema_name, entity_name, predef_type)
            predef_types_psets[predef_type] = []

            for pset_name in predef_type_pset:
                predef_types_psets[predef_type].append(all_psets_keys.index(pset_name))
        result["entities"][entity_name]["propertySets"]["predefinedTypes"] = predef_types_psets

        print(f"[{i}/{total_entities_num}] {entity_name} - {len(predefined_types)} predefined types ({schema_name})")
    
    return result

def gen_autocompletions(schema_name):
    result = get_autocompletions(schema_name)
    with open(f"{schema_name}_autocompletions.json", "w") as f:
        json.dump(result, f)
    
    with gzip.open(f"{schema_name}_autocompletions.json.gz", "wt") as f:
        json.dump(result, f)

    print(f"Autocompletions for {schema_name} schema saved to {schema_name}_autocompletions.json")

# CLI
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate JSON autocompletion files from IFC schemas')
    parser.add_argument('schema', nargs='?', help=f"IFC schema name to generate autocompletions for. Available: {', '.join(ifc_schemas)}")
    
    args = parser.parse_args()
    
    if args.schema:
        if args.schema in ifc_schemas:
            gen_autocompletions(args.schema)
        else:
            print(f"Error: Unsupported schema '{args.schema}'")
            print(f"Supported schemas: {', '.join(ifc_schemas)}")
            sys.exit(1)
    else:
        # Generate for all schemas if no schema name is provided
        print(f"Generating autocompletions for all supported schemas: {', '.join(ifc_schemas)}")
        for schema in ifc_schemas:
            gen_autocompletions(schema)
    print("\nDone!")