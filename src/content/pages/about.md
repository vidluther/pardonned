---
title: Why Pardonned Exists & How It's Built
description: About Pardonned — an unofficial tracker of presidential pardons and commutations of all living presidents, inspired by Liz Oyer's work on pardons by the current administration.
---

## What Is This Site?

This is an unofficial tracker of pardons granted by all living US Presidents (though this will eventually change). The site is inspired by [Liz Oyer's](https://www.lawyeroyer.com/) videos and posts about the appearance of impropriety in presidential pardons, especially under President Donald Trump.

## How Do We Get the Data?

The data for the website is available through the [DOJ Website](https://www.justice.gov/pardon/clemency-recipients). We scrape the website once a day, and rebuild the database. The code for the parser and to see how this website is built is public and available at [github.com/vidluther/pardonned](https://github.com/vidluther/pardonned).

## On Prison Time Reduced.

This is an estimate, and is hard to calculate. For example

Rod Blagojevich was convicted in 2011 for 168 months, he did serve 14 yrs in prison, so the current calculattion of prison time reduced is inaccurate. I'm sure there are other instances like this, especially for the mass commutations by Trump for January 6th rioters, and by Biden for the drug offenses.

Ross Ulbricht also spent some time in prison, so we need to keep that in mind.

## On Fines and Restitution Abandoned

This is an estimate as well, currently I do not know how to verify if any amount of fines or restitution was paid or not.

## How Can You Help?

I'd love your feedback and contributions! If you're a developer, send a PR or create an issue on GitHub. If you're not a developer but have ideas on how the site can be improved, reach out.
