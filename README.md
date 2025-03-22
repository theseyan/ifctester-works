## Autocompletions
This repo contains some preliminary work to implement autocompletions support. The CLI tool pre-generates only the necessary IFC schema information for autocompletions in JSON, which can then be sent to the frontend where the IDS parser can provide context-based suggestions.

```bash
python gen_autocompletions.py       # generate for all schemas
python gen_autocompletions.py IFC4  # generate for only IFC4
```

The general shape of the format is as below:
```json
{
	"IFC4": {
		"entities": {
			"IfcWall": {
				"attributes": [
					{
						"name": "GlobalId",
					},
					{
						"name": "Name",
					},
					...
				],
				"predefinedTypes": [ "SOMETHING", "USERDEFINED", ... ],
				"propertySets": {
					"default": [0, 5 ,10, ... ],
					"predefinedTypes": {
						"SOMETHING": [5, 11, ... ],
						"USERDEFINED": [0, 15, ... ],
						...
					}
				}
			},
			...
		},
		"propertySets": {
			"Pset_ActionRequest": [
				{
					"name": "RequestSourceLabel",
					"type": "IfcPropertySingleValue"
				},
				...
			],
			...
		},
		"classificationSystems": {
			"BB/SfB (3/4 cijfers)": {
				"source": "Regie der Gebouwen",
				"tokens": ['.']
			},
			...
		},
		"standardMaterials": [
			"concrete", "steel", ...
		]
	},
	...
}
```

The values in `propertySets` inside an entity are integers because they point to indices of the pset in the outer global `propertySets` map; this reduces duplication quite a bit.

Overall, there are still some shortcomings to be fixed:
- For `attributes`, only the name is stored for now and not data type
- For properties inside a Property set, the name and data_type are stored but not the base_type ([link](https://github.com/buildingSMART/IDS/blob/development/Documentation/ImplementersDocumentation/DataTypes.md))