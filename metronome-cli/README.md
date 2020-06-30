<h2 align="center">Metronome: 📈 Driving Changes with an Impact</h2>

Did you ever wonder what business objectives your changes target? Wouldn't it be great if you
could track their successes and failures? **Metronome** aims to bring business awareness to your
engineering discussions and the business context to your commits.

<p align="center">
<img src="https://user-images.githubusercontent.com/30813/86042360-f33fba00-ba3e-11ea-8d57-6cdc71dd7e46.png" />
</p>

## Table of Contents

- [Introduction](#introduction)
- [Tracking Business Metrics](#tracking-business-metrics)
- [Linking Commits to Metrics via Expectations](#linking-commits-to-metrics-via-expectations)
- [Performing Analysis](#performing-analysis)
  - [Installing and Running Metronome CLI](#installing-and-running-metronome-cli)
  - [Listing Active Metrics and Readings](#listing-active-metrics-and-readings)
  - [Testing Expectations](#testing-expectations)
  - [Validating Expectations](#validating-expectations)

## Introduction

**Metronome** is a development workflow in _three parts_. Firstly, it changes the place
[where teams store and consult their business KPIs](#tracking-business-metrics). Secondly, it
changes [how teams write their commits](#linking-commits-to-metrics-via-expectations). And lastly,
it provides an analytical capability [to review successes and failures](#performing-analysis) in
moving KPIs in the right direction. The expected result is an increased measurement awareness
within the development team and the reinforced link between code changes and their inevitable
business impacts.

## Tracking Business Metrics

### TLDR;

**Put KPIs into a `kpis/latest.prod.json` file under your repository. When updating said file
regularly, make sure you add `[meter-readings:prod]` into the commit body. Do not mix such commits
with other code changes.**

**Use [read-meters-action](https://github.com/everzet/metronome/tree/master/read-meters-action)
to simplify regular refresh of readings.**

### Longer Version

Business metrics, KPIs (Key Performance Indicators) or OKRs (Objectives and Key Results) are all
tangible ways of measuring the success of your product improvement efforts. Some of them might be
familiar to a development team in form of "non-functional" requirements. Some are historically
isolated within the domain of business management.

Some examples of valid business metrics include:

- `monthy_revenue`
- `conversion_rate`
- `net_promoter_score`
- `frontend_error_rate`
- `number_of_support_requests`
- `team_mood`
- etc.

Traditionally, business KPIs (or OKRs) are tracked via some sort of a business dashboard. That
limits awareness and breaks the connection between the work being done and its impact. Instead,
we suggest that a rightful place for the product KPIs is with the product itself - inside the
repository.

Place KPI readings inside a `JSON` file under your repository. This way, your engineering team
can track the impact of their work. Using `JSON` would allow you to create convenient tooling
around your measurements (**Metronome CLI** is one such tool). You have full control over the name
of said file and its place, but if you need ideas, we suggest starting with
`kpis/latest.prod.json`, where `prod` is the name of the tracked environment.

In order for tooling (including **Metronome CLI**) to identify both the KPIs and their changes,
make sure you commit changes to the readings file (e.g. `kpis/latest.prod.json`) separately from
other changes and that you mark it with `[meter-readings:prod]` text anywhere in the commit body
(`prod` is the name of the environment your readings are for). Metronome does not care about the
file name as it purely relies on the commit messages and attached changesets in order to read
metrics.

We can easily envision a situation where your team might want to have different readings per
environment. To avoid painful merge conflicts and resolutions in such cases, we suggest giving
every environment its own metric file. Hence the suggestion above of `kpis/latest.prod.json` for
a readings file name. This allows you to have `kpis/latest.dev.json`, `kpis/latest.staging.json`,
or others.

To simplify maintenance and refresh of your meters and their readings, you can use a
[read-meters](https://github.com/everzet/metronome/tree/master/read-meters-action) GitHub action
within your repository. It would help you establish an automated routine to always keep your
metrics up-to-date.

## Linking Commits to Metrics via Expectations

### TLDR;

**Mark commits that you expect to impact metrics with `[meter-expect: <your expectation>]` text in
their bodies.**

**Use Metronome CLI's [expectation validation command](#validating-expectations) to check that
`<your expectation>` is parseable and produces expected result.**

### Longer Version

After you [have put your business KPIs](#tracking-business-metrics) into the repository, it is
time to start linking your code changes to the changes in readings.

As you probably know, there is no direct link between code change and a business impact. Instead,
these two are linked via hypotheses. Or as we call them - **expectations**. Expectations (or
hypotheses) are timed, constrained KPI assessments about the future.

Some examples of expectations include:

- `monthly_revenue will increase by 10% in 2 months`
- `conversion_rate increases to 3.2 in 1 week`
- `net_promoter_score will increase to 8 in 4 weeks`
- `frontend_error_rate decreases by 20% in 1 month`
- `team_mood will become 'happy' in 2 weeks`

All expectations have four things in common:

1. **METER** - links expectations directly to a particular KPI (e.g. `monthly_revenue`)
2. **DIRECTION** - indicates direction of change (e.g. `increase to`, `decrease by`,
   `become`, etc.)
3. **MEASURE** - states expected target value or delta (e.g. `10%`, `3.2`, `'happy'`, etc.)
4. **TIMELINE** - sets the length of the feedback loop (e.g. `in 2 months`, `in 1 week`, etc.)

In order for tooling (including **Metronome CLI**) to identify commits linked to expectations,
make sure you mark commits in question with the `[meter-expect: <your-expectation>]` text anywhere
in the commit message. For Metronome to understand and be able to analyse expectations, they have
to be in the following format:

```
                                               - number (`25.0`)
                                               - percent (`5%`, `5 percent`)
                                               - boolean (`true`, `false`)
                                               - string (`'str'`)
                         completely
                          optional                    MEASURE
                             |                           |
                             v                           v
                            ----                        ----
      monthly_revenue       will       increase to      25.0      in 1 month
      ---------------                  -----------                ----------
             ^                              ^                         ^
             |                              |                         |
           METER                        DIRECTION                  TIMELINE

          name of                      direction of             natural sentece
        the metric                        change              in the future tense

(as per `latest.prod.json`)           - increase to             - within a week
                                      - increase by             - in 1 month
                                      - decrease to             - next week
                                      - decrease by
                                      - become
```

As it is very expensive to correct mistakes in past commit messages, **Metronome CLI** comes with
a [built-in command](#validating-expectations) to validate expectation strings and see their
parsed meaning. It will basically tell you if Metronome would be able to parse and analyse your
expectation later. We strongly suggest checking your expectation strings with that command, until
you get a hang of the language.

## Performing Analysis

In a nutshell, **Metronome CLI** is an analysis tool for your commits expectations, against your
repository's KPI readings. It can [plot your KPI changes over
time](#listing-active-metrics-and-readings). It can also [scan and validate your commit
expectations](#testing-expectations) against the KPI changes. Lastly, it can [help you write
commit expectations](#validating-expectations) in a way that is parseable by the automation
tooling (including Metronome CLI itself).

### Installing and Running Metronome CLI

You can install Metronome CLI into your project using `yarn`:

```
yarn add --dev @everzet/metronome-cli
```

Or `npm`:

```
npm install --save-dev @everzet/metronome-cli
```

You then can check available commands and options with:

```
metronome-cli --help
```

If you don't want to add dependencies to your project, you can always run Metronome CLI with
`npx`:

```
npx @everzet/metronome-cli --help
```

### Listing Active Metrics and Readings

<img src="https://user-images.githubusercontent.com/30813/86042640-5cbfc880-ba3f-11ea-9a44-00d8a5f49b05.png" align="right" width="50%" />

The first step in making a meaningful change isn't to form a hypothesis - it is to establish the
right measurement framework. You can easily set up custom meters and start refreshing your
`kpis/latest.prod.json` file regularly with the help of [read-meters
](https://github.com/everzet/metronome/tree/master/read-meters-action) GitHub action. But how do
you see all your metrics, with their historic data at a glance?

You can always utilise existing git and GitHub diff and blame tooling, but Metronome CLI makes it
even easier.

You can see all your metrics and their readings at a glance by running `meters` command with your
`metronome-cli` locally:

```
metronome-cli meters
```

Or via npx:

```
npx @everzet/metronome-cli meters
```

<br clear="all" />

### Testing Expectations

<img src="https://user-images.githubusercontent.com/30813/86042542-3863ec00-ba3f-11ea-97fe-103a7c24d470.png" align="right" width="50%" />

After you've [configured your KPIs](#tracking-business-metrics) and made a [change with
expectation linked](#linking-commits-to-metrics-via-expectations), it is time to start tracking
the prograss towards your goal.

You can see all your active expectations and their linked commits at a glance with `test` command:

```
metronome-cli test
```

Or via npx:

```
npx @everzet/metronome-cli test
```

<br clear="all" />

### Validating Expectations

<img src="https://user-images.githubusercontent.com/30813/86042843-aa3c3580-ba3f-11ea-8281-9cdfd7c32c16.png" align="right" width="50%" />

Writing parseable expectation strings at first might be a bit tricky. So we provide a tool to help
you quickly validate if a string means what you think it means in Metronome's parsing algorithm.

Just pass your expectation string to the `expect` command and see the result:

```
metronome-cli expect "nps will increase to 8 in 3 days"
```

Or via npx:

```
npx @everzet/metronome-cli expect "nps will increase to 8 in 3 days"
```

If your expectation is valid, you would see a breakdown of meter, direction, measure and example
timelines. If your expectation is invalid, you would see an error and the command will return
non-zero response (`1`).

<br clear="all" />
