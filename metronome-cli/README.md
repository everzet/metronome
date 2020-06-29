<p align="center">
<img src="https://user-images.githubusercontent.com/30813/86042360-f33fba00-ba3e-11ea-8d57-6cdc71dd7e46.png" width="600px" />
</p>

<h2 align="center">📈 Driving Impactful Changes</h2>

Did you ever wonder what business goals your code changes pursue? Wouldn't it be great if you
could track their successes and failures? **Metronome CLI** aims to bring business context to
your commits.

## Table of Contents

- [Preparing your repository](#preparing-your-repository)
  - [Tracking Business Metrics](#tracking-business-metrics)
  - [Linking Commits to Metrics via Expectations](#linking-commits-to-metrics-via-expectations)
- [Running Metronome CLI](#running-metronome-cli)
- [Performing Analysis](#performing-analysis)
  - [Listing Active Metrics and Readings](#testing-metrics-and-readings)
  - [Testing Expectations](#testing-expectations)
  - [Validating Expectations](#validating-expectations)

## Preparing your Repository

The most important part of Metronome isn't a CLI tool, but a methodology. Firstly, it changes the
place [where teams store and consult business KPIs](#tracking-business-metrics). Secondly, it
changes [how teams write their commits](#linking-commits-to-metrics-via-expectations). The
expected result is an increased product awareness within the development team and reinforced link
between code changes and business impacts.

### Tracking Business Metrics

#### TLDR;

**Put KPIs into a `kpis/latest.prod.json` file under your repository. When updating said file
regularly, make sure you add `[meter-readings:prod]` into the commit body.**

**Use [read-meters-action](../read-meters-action/README.md) to simplify regular refresh of
readings.**

#### Longer Version

Business metrics, KPIs (Key Performance Indicators) or OKRs (Objectives and Key Results) are
tangible ways of measuring product success. Some of them might be familiar to a development team
in form of "non-functional" requirements. Some are historically isolated within the domain of
management.

Some examples of valid business metrics include:

- `monthy_revenue`
- `conversion_rate`
- `net_promoter_score`
- `frontend_error_rate`
- `number_of_support_requests`
- `team_moode`
- etc.

Traditionally, business KPIs (or OKRs) are tracked via some sort of a business dashboard. That
limits access and severes connection between the work and impact. Instead, we suggest that the
rightful place for the product KPIs is with the product itself - inside the repository.

Place your metrics inside a `JSON` file within your repository. This way, all developers can
track the impact of their work. You have full control over the name of said file and its place,
but if you need ideas, we suggest starting with `kpis/latest.prod.json`, where `prod` is the name
of tracked environment.

In order for **Metronome CLI** tool to identify both the file itself and the changes withing it,
make sure you commit changes to the readings file (e.g. `kpis/latest.prod.json`) separately from
other changes and that you mark it with `[meter-readings:prod]` mark (just put that text into the
commit body). Metronome does not care about the file name as it purely relies on the commit
messages and attached changesets in order to read metrics.

To simplify maintenance (update) of meter readings, you can use a
[read-meters-action](../read-meters-action/README.md) GitHub action with your custom workflow. It
would help you establish an automated routine to keep your metrics up-to-date.

### Linking Commits to Metrics via Expectations

#### TLDR;

Mark commits that you expect to impact metrics with `[meter-expect: <your expectation>]` text in
their bodies. Use Metronome CLI's [expectation validation command](#validating-expectations) to
check that `<your expectation>` is parseable and produces expected result.

#### Longer Version

After you [have put your business KPIs](#tracking-business-metrics) into the repository, it is
time to start linking your code changes to the changes in these.

As you probably know, there is no direct link between code change and a business impact. Instead,
these two are linked via hypotheses. Or like we call them - **expectations**. Expectations (or
hypotheses) are timed, constrained KPI assessments about the future.

Some examples of expectations include:

- `monthly_revenue will increase by 10% in 2 months`
- `conversion_rate increases to 3.2 in 1 week`
- `net_promoter_score will increase to 8 in 4 weeks`
- `frontend_error_rate decreases by 20% in 1 month`
- `team_mood will become 'happy' in 2 weeks`

All expectations have four things in common. They all have:

1. **METER** - links expectations directly to a particular KPI (e.g. `monthly_revenue`)
2. **DIRECTION** - indicates direction of change (e.g. `increase to`, `decrease by`,
   `become`, etc.)
3. **MEASURE** - states expected target value or delta (e.g. `10%`, `3.2`, `'happy'`, etc.)
4. **TIMELINE** - sets the length of the feedback loop (e.g. `in 2 months`, `in 1 week`, etc.)

In order for **Metronome CLI** tool to identify commits linked to expectations, make sure you mark
commits in question with the `[meter-expect: <your-expectation>]`. For Metronome to understand and
be able to analyse expectations, they have to be in the following format:

```
                                                   can be one of:
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

 (as per `latest.prod.json`)          can be one of:            natural sentece
                                      - increase to           in the future tense
                                      - increase by                examples:
                                      - decrease to            - `within a week`
                                      - decrease by            - `in 1 month`
                                      - become                 - `next week`
```

As it is very dangerous and expensive to correct mistakes in commits, **Metronome CLI** comes with
a [built-in command](#validating-expectations) to validate expectation strings and see their
parsed meaning. It will basically tell you if Metronome would be able to parse and analyse your
expectation later. We strongly suggest checking your expectation strings with that command until
you get a hang of the language.

## Running Metronome CLI

You can install Metronome CLI into your project using `yarn`:

```
yarn add --dev @everzet/metronome-cli
```

Or `npm`:

```
npm install --save-dev @everzet/metronome-clie
```

You then can check available commands and options with:

```
metronome-cli --help
```

If you don't want to add dependencies to your project, you can always run any Metronome CLI with
`npx`:

```
npx @everzet/metronome-cli --help
```

## Performing Analysis

### Listing Active Metrics and Readings

![meters](https://user-images.githubusercontent.com/30813/86042640-5cbfc880-ba3f-11ea-9a44-00d8a5f49b05.png)

### Testing Expectations

![test](https://user-images.githubusercontent.com/30813/86042542-3863ec00-ba3f-11ea-97fe-103a7c24d470.png)

### Validating Expectations

![expect](https://user-images.githubusercontent.com/30813/86042843-aa3c3580-ba3f-11ea-8281-9cdfd7c32c16.png)
