# dots-vue-elec-settings

Configuration settings repo for [dots-vue](https://github.com/chartes/dots-vue) dedicated to the [digital editions (elec) of the ENC](https://dev.chartes.psl.eu/elec/).

## Validating the configuration

Every `*.conf.json` is checked against the schema of
[dots-vue-config-validator](https://github.com/dots-suite/dots-vue-config-validator) by
`.github/workflows/validate.yaml`.

To run it locally:

```bash
npm exec --package "https://github.com/dots-suite/dots-vue-config-validator" validate -- --generic-config custom.conf.json
shopt -s extglob
npm exec --package "https://github.com/dots-suite/dots-vue-config-validator" validate -- !(custom).conf.json
```
