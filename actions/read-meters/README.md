# Read meters GitHub action

This action executes meter functions within your repository and commits results of these into a
TOML file within the same repository.

The goals of this action are to increase developer awareness of the business objectives and to tie
real product KPIs with the evolution of its code.

## Inputs

### `repo-branch`

**Required, no default value** The name of the branch where readings should be committed to.
`main`, `develop`, `master`, etc.

### `repo-token`

**Required, no default value** The token that would allow the action to make a commit into the
repository. No default value, but you would usually use `${{ secrets.GITHUB_TOKEN }}` (always
available).

### `readings-path`

**Required, but has default value** The relative (to repository root) path to the readings file.
Can use `${repo-branch}` interpolation to specify branch name. To avoid merge conflicts, it is
recommended for each environment/branch to have its own readings file. Default is
`kpis/latest.${repo-branch}.toml` (notice lack of leading `./`).

### `meters-script`

**Required, but has default value** The relative (to repository root) path to the meters script.
The meters script is a NodeJS 12.x script that exports async functions - each represents a
different meter. Export name is a meter name and function promise result is the meter value. Keep
in mind that action does not run `npm install` for you, so you have to commit your `node_modules`
if your meters have dependencies. Default is `kpis/meters/index.js`.

## Outputs

### `readings`

All the current readings from all the meters, serialised as a JSON string.

## Example usage

Below is an example of a project with two meters (`revenue` and `pronicNumber`), read every 12
hours. Meters code is read from the `prod` branch. Meter readings are then committed into the
`kpis/latest.prod.toml` file under the `prod` branch.

### `.github/workflows/read-meters-prod.yml`

```yaml
on:
  schedule:
    # run every 12 hours, reading most recent stats and committing
    # changes to your readings file.
    #
    # use https://crontab.guru to fine-tune this and remember
    # that GitHub's timezone is UTC.
    - cron: '0 */12 * * *'

jobs:
  read-meters:
    runs-on: ubuntu-latest
    name: Update product KPIs

    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          # checkout specific branch, otherwise default branch
          # will be used always, which is a `on.schedule` quirk
          ref: prod

      - name: Read meters
        uses: everzet/metronome/actions/read-meters@master
        with:
          # ${{ secrets.GITHUB_TOKEN }} is always available within
          # a workflow for the given repository. Unless you want to
          # separate your meters code from readings file, below should
          # be enough
          repo-token: ${{ secrets.GITHUB_TOKEN }}

          # the branch name here should match the branch name
          # above, unless you have a different idea and you know
          # what you are doing
          repo-branch: prod

        env:
          # most of your meters would fetch data from third party APIs
          # or services. You can provide authentication details for these via
          # GitHub secrets and environment variables here. Environment variables
          # would be accessible within your meters with `process.env.NAME_OF_VAR`
          BUSINESS_DASHBOARD_API_KEY: ${{ secrets.BUSINESS_DASHBOARD_API_KEY }}
```

### `kpis/meters/index.js`

```js
const axios = require("axios");

module.exports.revenue = async () => {
  const API_KEY = process.env.BUSINESS_DASHBOARD_API_KEY;
  const { data } = await axios.get(`https://dashboard.our-company.com?apiKey=${API_KEY}`);
  return data.revenue;
};

module.exports.pronicNumber = async () => {
  return 42;
};
```

Note that the `revenue` meter uses `axios` library. You can install and use dependencies via `npm`
as per usual, but you would have to commit `kpis/meters/node_modules/` folder (don't forget to
remove it from `.gitignore`).
