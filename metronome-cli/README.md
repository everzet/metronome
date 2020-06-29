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

#### Longer version

Business metrics, KPIs (Key Performance Indicators) or OKRs (Objectives and Key Results) are
tangible ways of measuring product success. Some of them might be familiar to a development team
in form of "non-functional" requirements. Some are historically isolated within the domain of
management.

Some examples of business metrics include:

- Revenue
- Conversion Rate
- Net Promoter Score
- Frontend Error Rate
- Team Mood
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

## Running Metronome CLI

## Performing Analysis

### Listing Active Metrics and Readings

![meters](https://user-images.githubusercontent.com/30813/86042640-5cbfc880-ba3f-11ea-9a44-00d8a5f49b05.png)

### Testing Expectations

![test](https://user-images.githubusercontent.com/30813/86042542-3863ec00-ba3f-11ea-97fe-103a7c24d470.png)

### Validating Expectations

![expect](https://user-images.githubusercontent.com/30813/86042843-aa3c3580-ba3f-11ea-8281-9cdfd7c32c16.png)
